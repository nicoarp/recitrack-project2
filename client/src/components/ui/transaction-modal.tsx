import React, { useState, createContext, useContext } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface TransactionModalContextType {
  isOpen: boolean;
  title: string;
  content: React.ReactNode;
  showModal: (title: string, content: React.ReactNode) => void;
  updateModalContent: (title: string, content: React.ReactNode) => void;
  hideModal: () => void;
}

const TransactionModalContext = createContext<TransactionModalContextType | undefined>(undefined);

export const useTransactionModal = () => {
  const context = useContext(TransactionModalContext);
  if (context === undefined) {
    throw new Error("useTransactionModal must be used within a TransactionModalProvider");
  }
  return context;
};

export const TransactionModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<React.ReactNode>(null);

  const showModal = (title: string, content: React.ReactNode) => {
    setTitle(title);
    setContent(content);
    setIsOpen(true);
  };

  const updateModalContent = (title: string, content: React.ReactNode) => {
    setTitle(title);
    setContent(content);
  };

  const hideModal = () => {
    setIsOpen(false);
  };

  return (
    <TransactionModalContext.Provider value={{ isOpen, title, content, showModal, updateModalContent, hideModal }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    </TransactionModalContext.Provider>
  );
};

export default function TransactionModal() {
  return (
    <TransactionModalProvider>
      {/* This component is used as a wrapper and the actual modal is rendered by the provider */}
    </TransactionModalProvider>
  );
}

export function TransactionLoader({ message, txHash }: { message: string; txHash?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
      <p className="text-gray-700 text-center mb-2">{message}</p>
      {txHash && (
        <p className="text-xs text-gray-500 text-center">
          Hash de transacción: {txHash.substring(0, 20)}...
        </p>
      )}
    </div>
  );
}
