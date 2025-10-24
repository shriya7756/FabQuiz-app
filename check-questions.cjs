const mongoose = require('mongoose');
require('dotenv').config();

const questionSchema = new mongoose.Schema({}, { strict: false });
const Question = mongoose.model('Question', questionSchema);

async function checkQuestions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    // Get the quiz ID from the command line or use the one provided
    const quizId = '68fb7e0603d8c7e0337769fd';
    
    console.log(`Looking for questions in quiz: ${quizId}\n`);
    
    const questions = await Question.find({ 
      quizId: mongoose.Types.ObjectId.createFromHexString(quizId)
    });
    
    console.log(`Found ${questions.length} questions:\n`);
    
    questions.forEach((q, index) => {
      console.log(`Question ${index + 1}:`);
      console.log(`  Text: ${q.questionText?.substring(0, 60)}...`);
      console.log(`  Image URL: ${q.imageUrl || 'NO IMAGE'}`);
      console.log(`  Options: ${q.options?.length || 0}`);
      console.log('');
    });
    
    if (questions.length > 0) {
      console.log('\nFull first question data:');
      console.log(JSON.stringify(questions[0], null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkQuestions();
