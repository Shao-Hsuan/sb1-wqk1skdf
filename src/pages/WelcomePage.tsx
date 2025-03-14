import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Edit3 } from 'lucide-react';
import { generateLetter } from '../services/letterService';
import { useGoalStore } from '../store/goalStore';

export default function WelcomePage() {
  const [letter, setLetter] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const navigate = useNavigate();
  const currentGoal = useGoalStore(state => state.currentGoal);

  useEffect(() => {
    if (currentGoal?.id) {
      generateFirstLetter();
    }
  }, [currentGoal?.id]);

  const generateFirstLetter = async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      console.log('Generating first letter for goal:', currentGoal!.id);
      
      const letter = await generateLetter({
        goalId: currentGoal!.id,
        type: 'goal_created',
        isManual: true
      });

      console.log('First letter generated:', {
        id: letter.id,
        type: letter.type,
        title: letter.title
      });

      setLetter(letter);
    } catch (error) {
      console.error('Failed to generate first letter:', error);
      setError(error instanceof Error ? error.message : '生成信件失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWriteJournal = () => {
    navigate('/journal/new', { 
      state: { 
        letterId: letter.id,
        initialTitle: letter.reflection_question
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在生成你的第一封信...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-screen-sm mx-auto">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
            {error}
          </div>
          <button
            onClick={generateFirstLetter}
            className="w-full py-3 bg-red-500 text-white rounded-lg"
          >
            重試
          </button>
        </div>
      </div>
    );
  }

  if (!letter) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content with padding for bottom buttons */}
      <div className="pb-40">
        <div className="max-w-screen-sm mx-auto p-4">
          {/* Letter content */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <img
              src={letter.front_image}
              alt={letter.title}
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="p-6 space-y-4">
              <h1 className="text-2xl font-bold">{letter.title}</h1>
              <p className="text-lg text-blue-600">{letter.greeting}</p>
              <div className="text-gray-700 whitespace-pre-wrap">
                {letter.content}
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800">{letter.reflection_question}</p>
              </div>
              <p className="text-right text-gray-600 italic">{letter.signature}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom buttons with white background */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-50 p-4 border-t border-gray-100">
        <div className="max-w-screen-sm mx-auto space-y-4">
          <button
            onClick={handleWriteJournal}
            className="w-full bg-blue-500 text-white rounded-xl py-4 flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
          >
            <Edit3 className="w-5 h-5" />
            <span>寫下我的想法</span>
          </button>
          <button
            onClick={() => navigate('/journal')}
            className="w-full bg-white text-blue-500 rounded-xl py-4 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <span>先逛逛</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}