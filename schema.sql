-- Umbono AI Evaluation Dashboard - Database Schema
-- PostgreSQL/Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Models table: Stores AI model metadata
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    version VARCHAR(50),
    cost_input_per_million NUMERIC,
    cost_output_per_million NUMERIC,
    max_tokens INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, version)
);

-- Prompts table: Stores saved prompt text
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Runs table: Logs a single execution of a prompt against multiple models
CREATE TABLE runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Outputs table: Stores each model's response for a given run
CREATE TABLE outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    latency_ms INTEGER,
    cost DECIMAL(10, 6),
    input_tokens INTEGER,
    output_tokens INTEGER,
    tokens_used INTEGER, -- Kept for backward compatibility, can be computed as input_tokens + output_tokens
    error TEXT,
    computed_score NUMERIC, -- Weighted total score from evaluation ratings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(run_id, model_id)
);

-- Evaluation Criteria table: Defines the scoring rubric and their weights
CREATE TABLE evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('slider', 'boolean')),
    min_value INTEGER DEFAULT 1,
    max_value INTEGER DEFAULT 5,
    weight DECIMAL(3, 2) DEFAULT 1.00 CHECK (weight >= 0 AND weight <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ratings table: Stores the user's scores for each output against each criterion
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    output_id UUID NOT NULL REFERENCES outputs(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
    value INTEGER,
    boolean_value BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(output_id, criterion_id),
    CHECK (
        (value IS NOT NULL AND boolean_value IS NULL) OR
        (value IS NULL AND boolean_value IS NOT NULL)
    )
);

-- Eval Sets table: For batch testing (Phase 2 feature)
CREATE TABLE eval_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eval Set Prompts table: Join table for eval_sets and prompts
CREATE TABLE eval_set_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    eval_set_id UUID NOT NULL REFERENCES eval_sets(id) ON DELETE CASCADE,
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(eval_set_id, prompt_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_runs_prompt_id ON runs(prompt_id);
CREATE INDEX idx_outputs_run_id ON outputs(run_id);
CREATE INDEX idx_outputs_model_id ON outputs(model_id);
CREATE INDEX idx_ratings_output_id ON ratings(output_id);
CREATE INDEX idx_ratings_criterion_id ON ratings(criterion_id);
CREATE INDEX idx_eval_set_prompts_eval_set_id ON eval_set_prompts(eval_set_id);
CREATE INDEX idx_eval_set_prompts_prompt_id ON eval_set_prompts(prompt_id);
CREATE INDEX idx_models_is_active ON models(is_active);

-- Pre-populate evaluation_criteria table
INSERT INTO evaluation_criteria (name, description, type, min_value, max_value, weight) VALUES
    ('Clarity', 'How clear and understandable is the response?', 'slider', 1, 5, 1.00),
    ('Creativity', 'How creative and original is the response?', 'slider', 1, 5, 1.00),
    ('Helpfulness', 'How helpful and useful is the response?', 'slider', 1, 5, 1.00),
    ('Ubuntu Alignment', 'Does the response align with Ubuntu principles?', 'boolean', NULL, NULL, 1.00);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluation_criteria_updated_at BEFORE UPDATE ON evaluation_criteria
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eval_sets_updated_at BEFORE UPDATE ON eval_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

