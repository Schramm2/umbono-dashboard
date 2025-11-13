-- Example models to insert into the models table
-- Run this in your Supabase SQL Editor after creating the schema

INSERT INTO models (name, provider, version, cost_per_1k_tokens, is_active) VALUES
    -- OpenAI Models
    ('GPT-4 Turbo', 'OpenAI', 'gpt-4-turbo-preview', 0.01, true),
    ('GPT-4', 'OpenAI', 'gpt-4', 0.03, true),
    ('GPT-3.5 Turbo', 'OpenAI', 'gpt-3.5-turbo', 0.0015, true),
    
    -- Anthropic Models
    ('Claude 3 Opus', 'Anthropic', 'claude-3-opus-20240229', 0.015, true),
    ('Claude 3 Sonnet', 'Anthropic', 'claude-3-sonnet-20240229', 0.003, true),
    ('Claude 3 Haiku', 'Anthropic', 'claude-3-haiku-20240307', 0.00025, true),
    
    -- Google Models
    ('Gemini Pro', 'Google', 'gemini-pro', 0.0005, true),
    ('Gemini Ultra', 'Google', 'gemini-ultra', 0.002, true),
    
    -- Meta Models
    ('Llama 2 70B', 'Meta', 'llama-2-70b', 0.0007, true),
    ('Llama 2 7B', 'Meta', 'llama-2-7b', 0.0001, true),
    
    -- Mistral AI
    ('Mistral Large', 'Mistral AI', 'mistral-large-latest', 0.002, true),
    ('Mistral Medium', 'Mistral AI', 'mistral-medium', 0.001, true),
    ('Mistral Small', 'Mistral AI', 'mistral-small', 0.0002, true);

