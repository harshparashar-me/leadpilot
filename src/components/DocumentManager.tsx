import React, { useState, useEffect } from "react";
import { Upload, File, FileText, Image, Trash2, Download, Paperclip } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Document {
    id: string;
    name: string;
    file_path: string;
    size: number;
    type: string;
    created_at: string;
}

interface DocumentManagerProps {
    entityType: "lead" | "contact" | "deal" | "account";
    entityId: string;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ entityType, entityId }) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const fetchDocuments = React.useCallback(async () => {
        const { data, error } = await supabase
            .from("documents")
            .select("*")
            .eq("entity_type", entityType)
            .eq("entity_id", entityId)
            .order("created_at", { ascending: false });

        if (error) console.error("Error fetching docs:", error);
        else setDocuments(data || []);
    }, [entityId, entityType]);

    useEffect(() => {
        if (entityId) fetchDocuments();
    }, [entityId, fetchDocuments]);

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);

        try {
            const file = files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${entityType}s/${entityId}/${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('crm-documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { user } } = await supabase.auth.getUser();

            // 2. Save metadata to DB
            const { error: dbError } = await supabase
                .from('documents')
                .insert({
                    name: file.name,
                    file_path: filePath,
                    size: file.size,
                    type: file.type,
                    entity_type: entityType,
                    entity_id: entityId,
                    uploaded_by: user?.id
                });

            if (dbError) throw dbError;

            fetchDocuments();
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed. Make sure the storage bucket 'crm-documents' exists and policies are set.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string, path: string) => {
        if (!confirm("Are you sure?")) return;

        try {
            await supabase.storage.from('crm-documents').remove([path]);
            await supabase.from('documents').delete().eq('id', id);
            setDocuments(documents.filter(d => d.id !== id));
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const getIcon = (type: string) => {
        if (type.includes('image')) return <Image size={20} className="text-purple-600" />;
        if (type.includes('pdf')) return <FileText size={20} className="text-red-600" />;
        return <File size={20} className="text-blue-600" />;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const Sizes = ["B", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + Sizes[i];
    };

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    handleUpload(e.dataTransfer.files);
                }}
            >
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                        <Upload className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">
                            {uploading ? "Uploading..." : "Click or drag file to this area to upload"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Support for PDF, PNG, JPG, DOCX
                        </p>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => handleUpload(e.target.files)}
                        disabled={uploading}
                    />
                    <label
                        htmlFor="file-upload"
                        className={`text-xs px-4 py-2 bg-white border rounded-lg shadow-sm font-medium cursor-pointer hover:bg-gray-50 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        Select File
                    </label>
                </div>
            </div>

            {/* File List */}
            {documents.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                    {documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-gray-50 rounded-lg shrink-0">
                                    {getIcon(doc.type)}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">{doc.name}</h4>
                                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                        <span>{formatSize(doc.size)}</span>
                                        <span>•</span>
                                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => alert("Download logic would happen here via Supabase signed URL")}
                                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
                                    title="Download"
                                >
                                    <Download size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(doc.id, doc.file_path)}
                                    className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-600"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                !uploading && (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                            <Paperclip className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">No documents yet</h3>
                        <p className="text-xs text-gray-500 mt-1">Upload contracts, proposals, or invoices.</p>
                    </div>
                )
            )}
        </div>
    );
};
