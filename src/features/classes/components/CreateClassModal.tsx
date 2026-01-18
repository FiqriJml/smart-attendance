/**
 * Create Class Modal component
 * @module features/classes/components/CreateClassModal
 */

import { useState } from "react";
import { Modal, ModalFooter, Button, Input, Select } from "@/components/ui";
import { Rombel } from "@/types";

interface CreateClassModalProps {
    /** Whether modal is open */
    open: boolean;
    /** Close handler */
    onClose: () => void;
    /** Submit handler */
    onSubmit: (mapel: string, rombelId: string) => Promise<void>;
    /** Available rombels */
    rombels: Rombel[];
    /** Whether submission is in progress */
    isSubmitting: boolean;
}

/**
 * Modal for creating a new class
 * @example
 * <CreateClassModal 
 *   open={isOpen} 
 *   onClose={() => setIsOpen(false)}
 *   onSubmit={handleCreateClass}
 *   rombels={rombels}
 *   isSubmitting={isCreating}
 * />
 */
export function CreateClassModal({
    open,
    onClose,
    onSubmit,
    rombels,
    isSubmitting
}: CreateClassModalProps) {
    const [mapel, setMapel] = useState("");
    const [rombelId, setRombelId] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mapel || !rombelId) return;

        await onSubmit(mapel, rombelId);

        // Reset form
        setMapel("");
        setRombelId("");
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose} title="Buat Kelas Baru" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Mata Pelajaran"
                    placeholder="Contoh: Matematika Wajib"
                    value={mapel}
                    onChange={(e) => setMapel(e.target.value)}
                    required
                />

                <Select
                    label="Pilih Rombel"
                    value={rombelId}
                    onChange={(e) => setRombelId(e.target.value)}
                    required
                >
                    <option value="">-- Pilih Rombel --</option>
                    {rombels.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.nama_rombel}
                        </option>
                    ))}
                </Select>

                <ModalFooter>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        loading={isSubmitting}
                        className="flex-1"
                    >
                        Buat Kelas
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
