import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function getChatCompletion(messages: { role: 'user' | 'assistant'; content: string }[]) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant IA français serviable et amical. Tu réponds toujours en français de manière claire et concise.'
        },
        ...messages
      ],
      model: 'gpt-3.5-turbo',
    });

    return completion.choices[0].message.content;
  } catch (error: any) {
    console.error('Error calling OpenAI:', error);
    
    // Gestion spécifique des erreurs OpenAI
    if (error?.status === 429) {
      throw new Error('Le service est temporairement indisponible en raison de limitations de l\'API. Veuillez réessayer plus tard.');
    }
    
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('La clé API OpenAI n\'est pas configurée. Veuillez contacter l\'administrateur.');
    }

    throw new Error('Désolé, une erreur est survenue lors de la génération de la réponse. Veuillez réessayer.');
  }
}