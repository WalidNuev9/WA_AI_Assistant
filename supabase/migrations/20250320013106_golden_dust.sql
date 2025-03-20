/*
  # Configuration des tables pour le chatbot

  1. Nouvelles Tables
    - `messages`
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, clé étrangère vers auth.users)
      - `content` (text, contenu du message)
      - `role` (text, 'user' ou 'assistant')
      - `created_at` (timestamp)

  2. Sécurité
    - Activation RLS sur la table `messages`
    - Politique permettant aux utilisateurs de lire leurs propres messages
    - Politique permettant aux utilisateurs d'écrire leurs propres messages
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  content text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);