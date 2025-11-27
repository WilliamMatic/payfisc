import Portal from '../../components/Portal';
import FilterModal from './modals/FilterModal';
import DeclarationDetailsModal from './modals/DeclarationDetailsModal';
import { DeclarationDetails } from '@/services/dashboard/dashboardService';

interface DashboardModalsProps {
  showFilterModal: boolean;
  showDetailsModal: boolean;
  selectedDeclaration: DeclarationDetails | null;
  uniqueTaxNames: string[];
  filters: {
    status: string;
    taxType: string;
    taxpayerType: string;
    paymentMethod: string;
    paymentPlace: string;
    declaration: string;
    startDate: string;
    endDate: string;
  };
  onFilterClose: () => void;
  onDetailsClose: () => void;
  onFilterChange: (filters: any) => void;
  onResetFilters: () => void;
  onApplyFilters: () => void;
}

export default function DashboardModals({
  showFilterModal,
  showDetailsModal,
  selectedDeclaration,
  uniqueTaxNames,
  filters,
  onFilterClose,
  onDetailsClose,
  onFilterChange,
  onResetFilters,
  onApplyFilters
}: DashboardModalsProps) {
  return (
    <>
      {showFilterModal && (
        <Portal>
          <FilterModal
            filters={filters}
            uniqueTaxNames={uniqueTaxNames}
            onClose={onFilterClose}
            onFilterChange={onFilterChange}
            onResetFilters={onResetFilters}
            onApplyFilters={onApplyFilters}
          />
        </Portal>
      )}

      {showDetailsModal && selectedDeclaration && (
        <Portal>
          <DeclarationDetailsModal
            declaration={selectedDeclaration}
            onClose={onDetailsClose}
          />
        </Portal>
      )}
    </>
  );
}