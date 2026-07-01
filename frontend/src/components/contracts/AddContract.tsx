import React, { useState } from 'react';
import ContractTypeSelection, { ContractMainType } from './ContractTypeSelection';
import GovernmentContractForm from './GovernmentContractForm';
import CorporateContractForm from './CorporateContractForm';
import { ArrowLeft } from 'lucide-react';

export type AddContractStep = 
  | 'select_main' 
  | 'form_gov' 
  | 'placeholder_corp';

interface AddContractProps {
  onClose: () => void;
  onSuccess: (id: string) => void;
  resumeId?: string; // Kept for backward compatibility, currently passes to Govt form
}

export default function AddContract({ onClose, onSuccess, resumeId }: AddContractProps) {
  // If a resumeId exists (e.g. from a draft), we default to GovernmentContractForm for now,
  // as the old drafts were based on the single monolithic form.
  const [step, setStep] = useState<AddContractStep>(resumeId ? 'form_gov' : 'select_main');

  const handleMainTypeNext = (type: ContractMainType) => {
    if (type === 'Government') {
      setStep('form_gov');
    } else if (type === 'Corporate') {
      setStep('placeholder_corp');
    }
  };

  switch (step) {
    case 'select_main':
      return (
        <ContractTypeSelection 
          onNext={handleMainTypeNext} 
          onCancel={onClose} 
        />
      );
    
    case 'form_gov':
      return (
        <GovernmentContractForm 
          onClose={() => setStep('select_main')} 
          onSuccess={onSuccess} 
          resumeId={resumeId}
        />
      );

    case 'placeholder_corp':
      return (
        <CorporateContractForm 
          onBack={() => setStep('select_main')} 
          onSuccess={onSuccess} 
        />
      );

    default:
      return null;
  }
}
