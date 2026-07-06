import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  Contract,
  ContractService,
  ContractDocument,
  ContractNote,
  ContractPayment,
  ContractActivityLog,
  ContractDraft
} from '../types';
import { useCMS } from './CMSContext';
import { api } from '../api/client';

interface ContractContextType {
  contracts: Contract[];
  services: ContractService[];
  documents: ContractDocument[];
  notes: ContractNote[];
  payments: ContractPayment[];
  activityLogs: ContractActivityLog[];
  drafts: ContractDraft[];
  isLoading: boolean;
  error: string | null;

  fetchContracts: (filters?: any) => Promise<void>;

  // Mutators
  addContract: (contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  updateContract: (contract: Contract) => Promise<void>;
  deleteContract: (id: string) => void;
  duplicateContract: (id: string) => Promise<void>;
  changeContractStatus: (id: string, newStatus: Contract['status']) => void;
  
  saveDraft: (draft: ContractDraft | any) => Promise<any>;
  deleteDraft: (id: string) => Promise<void>;

  addNote: (note: Omit<ContractNote, 'id' | 'createdAt'>) => void;
  addDocument: (doc: Omit<ContractDocument, 'id' | 'uploadedAt'>) => void;
  addService: (service: Omit<ContractService, 'id'>) => void;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export const ContractProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, addNotification, isAuthenticated } = useCMS();

  const [contractsState, _setContracts] = useState<Contract[]>([]);
  const setContracts = (value: React.SetStateAction<Contract[]>) => {
    console.log('setContracts called');
    console.trace();
    _setContracts(value);
  };
  const contracts = contractsState;
  const [services, setServices] = useState<ContractService[]>([]);
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [notes, setNotes] = useState<ContractNote[]>([]);
  const [payments, setPayments] = useState<ContractPayment[]>([]);
  const [activityLogs, setActivityLogs] = useState<ContractActivityLog[]>([]);
  const [drafts, setDrafts] = useState<ContractDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = async (filters?: any) => {
    try {
      const data = await api.getContracts(filters);
      setContracts(data);
    } catch (err) {
      console.log('Failed to fetch contracts', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    fetchContracts();
    
    api.getContractServices()
      .then(data => {
        const mapped = data.map(svc => ({
          ...svc,
          locations: typeof (svc.locations as any) === 'string' ? ((svc.locations as any) ? (svc.locations as any).split(',').map((s: string) => s.trim()) : []) : svc.locations
        }));
        setServices(mapped);
      })
      .catch(err => console.log('Failed to fetch services', err));

    Promise.all([
      api.getContracts().catch(err => { console.error('Contracts failed', err); return []; }),
      api.getContractServices().catch(err => { console.error('Services failed', err); return []; }),
      api.getContractDocuments().catch(err => { console.error('Docs failed', err); return []; }),
      api.getContractNotes().catch(err => { console.error('Notes failed', err); return []; }),
      api.getContractPayments().catch(err => { console.error('Payments failed', err); return []; }),
      api.getContractActivityLogs().catch(err => { console.error('Activity logs failed', err); return []; }),
      api.getContractDrafts().catch(err => { console.error('Drafts failed', err); return []; })
    ])
      .then(([
        contractsData,
        servicesData,
        documentsData,
        notesData,
        paymentsData,
        activityLogsData,
        draftsData
      ]) => {
        setContracts(contractsData);
        
        const mappedServices = servicesData.map((svc: any) => ({
          ...svc,
          locations: typeof svc.locations === 'string' ? (svc.locations ? svc.locations.split(',').map((s: string) => s.trim()) : []) : svc.locations
        }));
        setServices(mappedServices);
        
        setDocuments(documentsData);
        setNotes(notesData);
        setPayments(paymentsData);
        setActivityLogs(activityLogsData);
        setDrafts(draftsData);
      })
      .catch(err => {
        console.error('Failed to fetch contract data', err);
        setError('Failed to fetch contract data from the server. Please try again later.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isAuthenticated]);

  const logActivity = (
    contractId: string | number,
    action: ContractActivityLog['action'],
    details: string,
    previousValue?: string,
    newValue?: string
  ) => {
    const newLog: ContractActivityLog = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      contractId: Number(contractId),
      action,
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: new Date().toISOString(),
      details,
      previousValue,
      newValue
    };
    api.createContractActivityLog(newLog).then(savedLog => {
      setActivityLogs((prev) => [savedLog, ...prev]);
    }).catch(err => {
      console.error('Failed to save activity log to DB', err);
    });
  };

  const addContract = async (contractData: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'> & { id?: string, _activeStep?: string }) => {
    console.log('addContract called');
    console.trace();
    
    const newContract: Contract = {
      ...contractData,
      id: contractData.id || Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any;

    try {
      const savedContract = await api.createContract(newContract);
      setContracts((prev) => [savedContract, ...prev]);
      logActivity(savedContract.id, 'Created', `Contract ${savedContract.contractNumber} created.`);
      addNotification({
        title: 'New Contract Created',
        message: `Contract ${savedContract.contractNumber} (${savedContract.title}) has been drafted.`,
      });
      // If promoting from a draft, delete the draft
      if (contractData.id) {
        deleteDraft(contractData.id).catch(e => console.error("Failed to cleanup draft after creating contract", e));
      }
    } catch (err: any) {
      console.error('Failed to create contract', err);
      throw err;
    }
  };

  const updateContract = async (contract: Contract & { _activeStep?: string }) => {
    const updatedContract = { ...contract, updatedAt: new Date().toISOString(), updatedBy: currentUser.name };

    try {
      const savedContract = await api.updateContract(contract.id, updatedContract);
      setContracts((prev) => prev.map((c) => (c.id === contract.id ? savedContract : c)));
      logActivity(contract.id, 'Edited', `Contract details updated.`);
    } catch (err: any) {
      console.error('Failed to update contract', err);
      throw new Error(err.response?.data?.detail || err.message || 'Failed to update contract.');
    }
  };

  const deleteContract = (id: string) => {
    api.deleteContract(id).then(() => {
      setContracts((prev) => prev.filter((c) => c.id !== id));
      logActivity(id, 'Deleted', `Contract soft deleted or removed.`);
    }).catch(err => console.error('Failed to delete contract', err));
  };

  const duplicateContract = async (id: string) => {
    const original = contracts.find(c => c.id === id);
    if (!original) return;
    const copy = { ...original };
    delete (copy as any).id;
    delete (copy as any).createdAt;
    delete (copy as any).updatedAt;
    copy.title = `${copy.title} (Copy)`;
    copy.contractNumber = `${copy.contractNumber}-COPY-${Math.floor(Math.random() * 1000)}`;
    await addContract(copy);
  };

  const saveDraft = async (draft: ContractDraft) => {
    console.log('saveDraft called');
    console.trace();
    try {
      const existing = drafts.find(d => d.id.toString() === draft.id.toString());
      let savedDraft;
      if (existing) {
        console.log('[Draft Save] Updating existing draft:', draft.id);
        savedDraft = await api.updateContractDraft(draft.id, draft);
        console.log('[Draft Save] Updated draft response:', savedDraft);
        setDrafts(prev => prev.map(d => d.id.toString() === draft.id.toString() ? savedDraft : d));
      } else {
        console.log('[Draft Save] Creating new draft:', draft.id);
        savedDraft = await api.createContractDraft(draft);
        console.log('[Draft Save] Created draft response:', savedDraft);
        setDrafts(prev => [savedDraft, ...prev]);
      }
      console.log('[Draft Save] Draft Count Rendered:', drafts.length + (existing ? 0 : 1));
      return savedDraft;
    } catch (err) {
      console.error('[Draft Save] Failed to save draft', err);
      throw err;
    }
  };

  const deleteDraft = async (id: string) => {
    try {
      await api.deleteContractDraft(id);
      setDrafts(prev => prev.filter(d => d.id.toString() !== id.toString()));
    } catch (err: any) {
      console.error('Failed to delete draft', err);
      throw new Error(err.response?.data?.detail || err.message || 'Failed to delete draft.');
    }
  };

  const changeContractStatus = (id: string, newStatus: Contract['status']) => {
    const contract = contracts.find(c => c.id === id);
    if (!contract) return;
    const updatedFields: Partial<Contract> = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name
    };
    api.updateContract(id, updatedFields).then(savedContract => {
      setContracts((prev) => prev.map((c) => (c.id === id ? savedContract : c)));
      logActivity(id, 'Status Changed', `Status updated to ${newStatus}`, contract.status, newStatus);
      if (newStatus === 'Active') {
        addNotification({
          title: 'Contract Activated',
          message: `Contract ${contract.contractNumber} is now Active.`
        });
      }
    }).catch(err => console.error('Failed to change contract status', err));
  };

  const addNote = (noteData: Omit<ContractNote, 'id' | 'createdAt'>) => {
    const newNote: ContractNote = {
      ...noteData,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    api.createContractNote(newNote).then(savedNote => {
      setNotes((prev) => [savedNote, ...prev]);
      logActivity(savedNote.contractId, 'Note Added', `Added ${savedNote.type.toLowerCase()} note.`);
    }).catch(err => console.error('Failed to add note', err));
  };

  const addDocument = (docData: Omit<ContractDocument, 'id' | 'uploadedAt'>) => {
    const newDoc: ContractDocument = {
      ...docData,
      id: Date.now(),
      uploadedAt: new Date().toISOString()
    };
    api.createContractDocument(newDoc).then(savedDoc => {
      setDocuments((prev) => [savedDoc, ...prev]);
      logActivity(savedDoc.contractId, 'Document Uploaded', `Uploaded document: ${savedDoc.title}`);
    }).catch(err => console.error('Failed to add document', err));
  };

  const addService = (serviceData: Omit<ContractService, 'id'>) => {
    const newService: ContractService = {
      ...serviceData,
      id: Date.now()
    };
    const apiPayload = {
      ...newService,
      locations: Array.isArray(newService.locations) ? newService.locations.join(', ') : newService.locations
    };
    api.createContractService(apiPayload as any).then(savedService => {
      const mapped = {
        ...savedService,
        locations: typeof (savedService.locations as any) === 'string' ? ((savedService.locations as any) ? (savedService.locations as any).split(',').map((s: string) => s.trim()) : []) : savedService.locations
      };
      setServices((prev) => [mapped as any, ...prev]);
    }).catch(err => console.error('Failed to add service', err));
  };

  return (
    <ContractContext.Provider
      value={{
        contracts,
        services,
        documents,
        notes,
        payments,
        activityLogs,
        drafts,
        isLoading,
        error,
        fetchContracts,
        addContract,
        updateContract,
        deleteContract,
        duplicateContract,
        changeContractStatus,
        saveDraft,
        deleteDraft,
        addNote,
        addDocument,
        addService
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContracts = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContracts must be used within a ContractProvider');
  }
  return context;
};
