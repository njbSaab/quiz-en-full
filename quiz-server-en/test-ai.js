const { Groq } = require('groq-sdk'); // Убедись, что groq-sdk установлен: npm i groq-sdk

const groq = new Groq({
}); // Замени на новый ключ!

async function testQuiz() {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content:
            'Сгенерируй простой квиз по теме "Футбол лига чемпионов" в формате JSON. 2 вопроса, по 4 ответа каждый.',
        },
      ],
      model: 'llama-3.3-70b-versatile', // Актуальная модель
      temperature: 0.7,
      max_tokens: 500, // Меньше, для теста
    });

    let response = completion.choices[0]?.message?.content || '';
    console.log('Raw ответ от Groq:\n', response);

    // Простая очистка Markdown (если есть)
    response = response.trim();
    if (response.startsWith('```json')) response = response.slice(7).trim();
    else if (response.startsWith('```')) response = response.slice(3).trim();
    if (response.endsWith('```')) response = response.slice(0, -3).trim();

    try {
      const quiz = JSON.parse(response);
      console.log('Спарсенный JSON:\n', JSON.stringify(quiz, null, 2));
    } catch (e) {
      console.log('Ошибка парсинга:', e.message);
    }
  } catch (error) {
    console.error('Ошибка Groq:', error.message);
    if (error.status === 401)
      console.log('🔑 Проблема с ключом: invalid или отсутствует.');
    else if (error.status === 400)
      console.log('🚫 Модель устарела или неверный запрос.');
    else if (error.status === 429)
      console.log('⏳ Rate limit: подожди 1-5 мин.');
  }
}

testQuiz();
