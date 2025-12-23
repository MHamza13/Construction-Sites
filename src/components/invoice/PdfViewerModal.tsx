// src/components/invoice/PdfViewerModal.tsx
import React from 'react';
import { X } from 'lucide-react';

interface PdfViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ isOpen, onClose, pdfUrl }) => {
    if (!isOpen) return null;

    const iframeHeightStyle = {
        height: 'calc(90vh - 65px)' 
    };

    return (
        <div 
            className="fixed inset-0 z-50 overflow-y-auto" 
            aria-labelledby="modal-title" 
            role="dialog" 
            aria-modal="true"
        >
            <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                aria-hidden="true" 
                onClick={onClose}
            ></div>

            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full h-[90vh] sm:max-w-7xl">
                    
                    <div className="bg-gray-100 dark:bg-gray-900 px-4 py-3 sm:px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                            Invoice PDF Viewer
                        </h3>
                        <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                            onClick={onClose}
                            aria-label="Close modal"
                        >
                            <X className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="w-full h-full p-0">
                        {pdfUrl ? (
                            <iframe
                                src={pdfUrl}
                                title="Invoice PDF"
                                className="w-full h-full border-none"
                                style={iframeHeightStyle}
                                allowFullScreen
                            >
                                <p className="p-4 text-gray-500 dark:text-gray-400">
                                    Your browser doesn't support iframes. You can <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">download the PDF</a> instead.
                                </p>
                            </iframe>
                        ) : (
                            <div className="flex items-center justify-center h-full text-lg text-gray-500 dark:text-gray-400 p-4">
                                 No PDF URL found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};