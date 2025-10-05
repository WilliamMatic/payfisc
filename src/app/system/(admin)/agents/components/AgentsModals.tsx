import Portal from '../../components/Portal';
import AddAgentModal from './modals/AddAgentModal';
import EditAgentModal from './modals/EditAgentModal';
import DeleteAgentModal from './modals/DeleteAgentModal';
import StatusAgentModal from './modals/StatusAgentModal';
import PrivilegesAgentModal from './modals/PrivilegesAgentModal';
import { Agent as AgentType, Privilege } from '@/services/agents/agentService';

interface AgentsModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  showPrivilegesModal: boolean;
  selectedAgent: AgentType | null;
  formData: { nom: string; prenom: string; email: string };
  agentPrivileges: Privilege[];
  processing: boolean;
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onPrivilegesClose: () => void;
  onFormDataChange: (data: { nom: string; prenom: string; email: string }) => void;
  onAgentPrivilegesChange: (privileges: Privilege[]) => void;
  onAddAgent: () => Promise<void>;
  onEditAgent: () => Promise<void>;
  onDeleteAgent: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
  onSavePrivileges: () => Promise<void>;
}

export default function AgentsModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  showStatusModal,
  showPrivilegesModal,
  selectedAgent,
  formData,
  agentPrivileges,
  processing,
  onAddClose,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onPrivilegesClose,
  onFormDataChange,
  onAgentPrivilegesChange,
  onAddAgent,
  onEditAgent,
  onDeleteAgent,
  onToggleStatus,
  onSavePrivileges
}: AgentsModalsProps) {
  return (
    <>
      {showAddModal && (
        <Portal>
          <AddAgentModal
            formData={formData}
            processing={processing}
            onClose={onAddClose}
            onFormDataChange={onFormDataChange}
            onAddAgent={onAddAgent}
          />
        </Portal>
      )}

      {showEditModal && selectedAgent && (
        <Portal>
          <EditAgentModal
            agent={selectedAgent}
            formData={formData}
            processing={processing}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditAgent={onEditAgent}
          />
        </Portal>
      )}

      {showDeleteModal && selectedAgent && (
        <Portal>
          <DeleteAgentModal
            agent={selectedAgent}
            processing={processing}
            onClose={onDeleteClose}
            onDeleteAgent={onDeleteAgent}
          />
        </Portal>
      )}

      {showStatusModal && selectedAgent && (
        <Portal>
          <StatusAgentModal
            agent={selectedAgent}
            processing={processing}
            onClose={onStatusClose}
            onToggleStatus={onToggleStatus}
          />
        </Portal>
      )}

      {showPrivilegesModal && selectedAgent && (
        <Portal>
          <PrivilegesAgentModal
            agent={selectedAgent}
            privileges={agentPrivileges}
            processing={processing}
            onClose={onPrivilegesClose}
            onPrivilegesChange={onAgentPrivilegesChange}
            onSavePrivileges={onSavePrivileges}
          />
        </Portal>
      )}
    </>
  );
}