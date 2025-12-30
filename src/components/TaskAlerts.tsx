import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Global component to check for overdue tasks and alert the user.
 * Should be mounted once in the main layout/app.
 */
export const TaskAlerts: React.FC = () => {
    useEffect(() => {
        checkOverdueTasks();
    }, []);

    const checkOverdueTasks = async () => {
        try {
            const today = new Date().toISOString();
            const { data, error } = await supabase
                .from('tasks')
                .select('id, subject, due_date')
                .lt('due_date', today)
                .neq('status', 'Completed');

            if (error) throw error;

            if (data && data.length > 0) {
                // Alert for the most critical or count
                toast.error(
                    <div className="flex flex-col gap-1">
                        <span className="font-bold flex items-center gap-2">
                            <Bell size={16} className="text-red-500" />
                            {data.length} Overdue Tasks!
                        </span>
                        <span className="text-xs">
                            You have {data.length} tasks that are overdue. Please check your tasks list.
                        </span>
                    </div>,
                    { duration: 6000 }
                );
            }
        } catch (err) {
            console.error("Failed to check overdue tasks:", err);
        }
    };

    return null; // Headless component
};
