-- betterMind Database Schema
-- This file initializes the PostgreSQL database with all required tables

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
-- Stores user account information and authentication data
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    -- Password hash (bcrypt) - NULL for OAuth users
    password_hash VARCHAR(255),
    -- User's self-description for AI personalization
    description TEXT,
    -- User's stated problems/challenges
    problems TEXT,
    -- Authentication provider: 'local' or 'google'
    auth_provider VARCHAR(50) NOT NULL DEFAULT 'local',
    -- Google OAuth ID (NULL for local auth)
    google_id VARCHAR(255) UNIQUE,
    -- Profile picture URL
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_auth_provider CHECK (auth_provider IN ('local', 'google')),
    -- Local auth users must have password, OAuth users must have google_id
    CONSTRAINT check_auth_requirements CHECK (
        (auth_provider = 'local' AND password_hash IS NOT NULL) OR
        (auth_provider = 'google' AND google_id IS NOT NULL)
    )
);

-- Conversations table
-- Stores chat sessions between users and AI
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Optional title for the conversation
    title VARCHAR(255),
    -- AI-generated summary of the conversation
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
-- Stores individual messages within conversations
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    -- Message role: 'user', 'assistant', or 'system'
    role VARCHAR(50) NOT NULL,
    -- Message type: 'text' or 'voice'
    type VARCHAR(50) NOT NULL DEFAULT 'text',
    -- Message content (text)
    content TEXT NOT NULL,
    -- URL to audio file (for voice messages)
    audio_url TEXT,
    -- Audio duration in seconds (for voice messages)
    audio_duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_message_role CHECK (role IN ('user', 'assistant', 'system')),
    CONSTRAINT check_message_type CHECK (type IN ('text', 'voice')),
    -- Voice messages must have audio_url
    CONSTRAINT check_voice_message CHECK (
        (type = 'text') OR 
        (type = 'voice' AND audio_url IS NOT NULL)
    )
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a test user for development (password: Test1234)
-- This is only for local development, remove in production
INSERT INTO users (email, name, password_hash, auth_provider, description, problems)
VALUES (
    'test@example.com',
    'Test User',
    '$2b$10$rKvVJvH8qN5xZ5xZ5xZ5xOqN5xZ5xZ5xZ5xZ5xZ5xZ5xZ5xZ5xZ5x',
    'local',
    'I am a test user exploring the betterMind platform.',
    'I want to work on managing stress and improving my daily mindfulness practice.'
) ON CONFLICT (email) DO NOTHING;
