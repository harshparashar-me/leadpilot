import React, { useState, useEffect } from 'react';
import { getNotes, addNote, deleteNote, toggleNotePin, updateNote } from '../lib/activityAudit';
import { MessageSquare, Pin, Trash2, Edit2, Save, X } from 'lucide-react';

interface RecordNotesProps {
    entityType: 'lead' | 'contact' | 'deal' | 'task' | 'account' | 'property' | 'site_visit';
    entityId: string;
}

export const RecordNotes: React.FC<RecordNotesProps> = ({ entityType, entityId }) => {
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const formatDateTime = (value: string | Date) =>
        new Date(value).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });

    const fetchNotes = async () => {
        try {
            const data = await getNotes(entityType, entityId);
            setNotes(data);
        } catch (err) {
            console.error('Error fetching notes:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [entityType, entityId]);

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim() || submitting) return;

        setSubmitting(true);
        try {
            await addNote(entityType, entityId, newNote.trim());
            setNewNote('');
            await fetchNotes();
        } catch (err) {
            console.error('Error adding note:', err);
            alert('Failed to add note');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            await deleteNote(noteId);
            await fetchNotes();
        } catch (err) {
            console.error('Error deleting note:', err);
            alert('Failed to delete note');
        }
    };

    const handleTogglePin = async (noteId: string, currentlyPinned: boolean) => {
        try {
            await toggleNotePin(noteId, !currentlyPinned);
            await fetchNotes();
        } catch (err) {
            console.error('Error toggling pin:', err);
            alert('Failed to update pin status');
        }
    };

    const handleStartEdit = (note: any) => {
        setEditingId(note.id);
        setEditText(note.note_text);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditText('');
    };

    const handleSaveEdit = async (noteId: string) => {
        if (!editText.trim()) return;

        try {
            await updateNote(noteId, editText.trim());
            setEditingId(null);
            setEditText('');
            await fetchNotes();
        } catch (err) {
            console.error('Error updating note:', err);
            alert('Failed to update note');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">Loading notes...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                />
                <button
                    type="submit"
                    disabled={submitting || !newNote.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                    {submitting ? 'Adding...' : 'Add Note'}
                </button>
            </form>

            {/* Notes List */}
            {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
                    <p className="text-sm">No notes yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notes.map((note) => (
                        <div
                            key={note.id}
                            className={`border rounded-lg p-3 ${note.pinned ? 'bg-yellow-50 border-yellow-300' : 'bg-white'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {note.pinned && <Pin className="h-4 w-4 text-yellow-600" />}
                                        <span className="text-sm font-medium text-gray-900">
                                            {note.user?.name || note.user?.email || 'Unknown User'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {formatDateTime(note.created_at)}
                                        </span>
                                    </div>

                                    {editingId === note.id ? (
                                        <div className="space-y-2">
                                            <textarea
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500"
                                                rows={3}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleSaveEdit(note.id)}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                                                >
                                                    <Save className="h-3 w-3" />
                                                    Save
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 flex items-center gap-1"
                                                >
                                                    <X className="h-3 w-3" />
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note_text}</p>
                                    )}
                                </div>

                                {editingId !== note.id && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleTogglePin(note.id, note.pinned)}
                                            className={`p-1 rounded hover:bg-gray-100 ${note.pinned ? 'text-yellow-600' : 'text-gray-400'
                                                }`}
                                            title={note.pinned ? 'Unpin note' : 'Pin note'}
                                        >
                                            <Pin className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleStartEdit(note)}
                                            className="p-1 rounded hover:bg-gray-100 text-gray-600"
                                            title="Edit note"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteNote(note.id)}
                                            className="p-1 rounded hover:bg-gray-100 text-red-600"
                                            title="Delete note"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
