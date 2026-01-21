/**
 * Custom hook for managing students data with SWR
 * Extracts data fetching and filtering logic from the UI
 * @module features/students/hooks/useStudents
 */

import useSWR from "swr";
import { useMemo, useState, useEffect } from "react";
import { adminService } from "@/services/adminService";
import { Student } from "@/types";

const fetcher = () => adminService.getAllStudentsOptimized();

interface UseStudentsReturn {
    /** All students from the database */
    students: Student[];
    /** Filtered students based on current filters */
    filteredStudents: Student[];
    /** Paginated students for display */
    paginatedStudents: Student[];
    /** Whether data is loading */
    isLoading: boolean;
    /** Error if any */
    error: Error | undefined;
    /** Refresh the student list */
    refresh: () => void;
    /** Current search term */
    searchTerm: string;
    /** Set search term */
    setSearchTerm: (term: string) => void;
    /** Current rombel filter */
    filterRombel: string;
    /** Set rombel filter */
    setFilterRombel: (rombel: string) => void;
    /** Current tingkat filter */
    filterTingkat: string;
    /** Set tingkat filter */
    setFilterTingkat: (tingkat: string) => void;
    /** Current page number (1-indexed) */
    page: number;
    /** Set current page */
    setPage: (page: number) => void;
    /** Total number of pages */
    totalPages: number;
    /** Total filtered count */
    totalFiltered: number;
    /** Items per page */
    itemsPerPage: number;
    /** Unique rombel IDs for filter dropdown */
    uniqueRombels: { id: string, name: string }[];
}

export function useStudents(itemsPerPage: number = 20): UseStudentsReturn {
    // SWR for data fetching with caching
    const { data: students = [], error, isLoading, mutate } = useSWR(
        'students',
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000
        }
    );

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRombel, setFilterRombel] = useState("");
    const [filterTingkat, setFilterTingkat] = useState("");
    const [page, setPage] = useState(1);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [searchTerm, filterRombel, filterTingkat]);

    // Extract unique rombels for dropdown
    // Extract unique rombels for dropdown
    const uniqueRombels = useMemo(() => {
        const map = new Map<string, string>();
        students.forEach(s => {
            if (s.rombel_id && !map.has(s.rombel_id)) {
                map.set(s.rombel_id, s.nama_rombel || s.rombel_id);
            }
        });
        return Array.from(map.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [students]);

    // Filtered data
    const filteredStudents = useMemo(() => {
        let result = students;

        // Text search
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(s =>
                s.nama.toLowerCase().includes(lower) ||
                s.nisn.includes(lower) ||
                s.rombel_id.toLowerCase().includes(lower)
            );
        }

        // Rombel filter
        if (filterRombel) {
            result = result.filter(s => s.rombel_id === filterRombel);
        }

        // Tingkat filter
        if (filterTingkat) {
            const tingkatNumber = parseInt(filterTingkat);
            result = result.filter(s => s.tingkat === tingkatNumber);
        }

        return result;
    }, [students, searchTerm, filterRombel, filterTingkat]);

    // Pagination
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    const paginatedStudents = useMemo(() => {
        const startIndex = (page - 1) * itemsPerPage;
        return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredStudents, page, itemsPerPage]);

    return {
        students,
        filteredStudents,
        paginatedStudents,
        isLoading,
        error,
        refresh: mutate,
        searchTerm,
        setSearchTerm,
        filterRombel,
        setFilterRombel,
        filterTingkat,
        setFilterTingkat,
        page,
        setPage,
        totalPages,
        totalFiltered: filteredStudents.length,
        itemsPerPage,
        uniqueRombels
    };
}
