import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string | React.ReactNode;
  onClose: () => void;
  actionButtonText?: string;
}

export function FeedbackModal({ isOpen, type, title, message, onClose, actionButtonText = 'OK' }: FeedbackModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-green-500 w-16 h-16 mb-4" />;
      case 'error': return <AlertCircle className="text-red-500 w-16 h-16 mb-4" />;
      case 'info': return <Info className="text-blue-500 w-16 h-16 mb-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 print:hidden">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-end p-2">
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-2 flex flex-col items-center text-center">
          {getIcon()}
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <div className="text-gray-600 mb-6">{message}</div>
          
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all shadow-md
              ${type === 'success' ? 'bg-green-500 hover:bg-green-600 shadow-green-200' : ''}
              ${type === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : ''}
              ${type === 'info' ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-200' : ''}
            `}
          >
            {actionButtonText}
          </button>
        </div>

      </div>
    </div>
  );
}
