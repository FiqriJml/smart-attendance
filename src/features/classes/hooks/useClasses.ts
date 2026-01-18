/**
 * Custom hook for managing class data
 * @module features/classes/hooks/useClasses
 */

import useSWR from "swr";
import { classService } from "@/services/classService";
import { masterDataService } from "@/services/masterDataService";
import { ClassSession, Rombel } from "@/types";
import { useState, useCallback } from "react";

interface UseClassesReturn {
    /** List of classes for the current teacher */
    classes: ClassSession[];
    /** Available rombels for class creation */
    rombels: Rombel[];
    /** Whether data is loading */
    isLoading: boolean;
    /** Error if any */
    error: Error | undefined;
    /** Refresh classes list */
    refresh: () => void;
    /** Create a new class */
    createClass: (mapel: string, rombelId: string) => Promise<ClassSession>;
    /** Whether class creation is in progress */
    isCreating: boolean;
    /** Load rombels for the create modal */
    loadRombels: () => Promise<void>;
    /** Whether rombels are loading */
    isLoadingRombels: boolean;
}

export function useClasses(teacherId: string | undefined): UseClassesReturn {
    const [rombels, setRombels] = useState<Rombel[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoadingRombels, setIsLoadingRombels] = useState(false);

    // SWR for classes
    const { data: classes = [], error, isLoading, mutate } = useSWR(
        teacherId ? ["classes", teacherId] : null,
        () => classService.getClassesByTeacher(teacherId!),
        {
            revalidateOnFocus: false
        }
    );

    // Load rombels for create modal
    const loadRombels = useCallback(async () => {
        setIsLoadingRombels(true);
        try {
            const data = await masterDataService.getAllRombels();
            setRombels(data);
        } catch (e) {
            console.error("Failed to load rombels:", e);
            throw e;
        } finally {
            setIsLoadingRombels(false);
        }
    }, []);

    // Create new class
    const createClass = useCallback(async (mapel: string, rombelId: string): Promise<ClassSession> => {
        if (!teacherId) throw new Error("Teacher ID required");

        setIsCreating(true);
        try {
            const newClass = await classService.createClassSession(teacherId, mapel, rombelId);
            await mutate(); // Refresh list
            return newClass;
        } finally {
            setIsCreating(false);
        }
    }, [teacherId, mutate]);

    return {
        classes,
        rombels,
        isLoading,
        error,
        refresh: mutate,
        createClass,
        isCreating,
        loadRombels,
        isLoadingRombels
    };
}
