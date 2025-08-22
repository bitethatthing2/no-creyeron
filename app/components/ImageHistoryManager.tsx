// app/components/ImageHistoryManager.tsx
"use client";

import { useState, useEffect } from "react";
import { useImageManagement } from "@/app/hooks/useImageManagement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
    Upload, 
    History, 
    RotateCcw, 
    Trash2, 
    Image as ImageIcon,
    User
} from "lucide-react";

interface ImageHistoryItem {
    id: string;
    user_id: string;
    type: "profile" | "chat" | "banner" | "other";
    old_url: string;
    new_url: string;
    replaced_at: string;
    deletion_status: "pending" | "deleted" | "failed" | "kept";
    metadata?: any;
}

interface ImageHistoryViewerProps {
    userId: string;
    type?: "profile" | "chat" | "banner" | "other";
    onRevert?: (item: ImageHistoryItem) => void;
}

export function ImageHistoryViewer({ 
    userId, 
    type = "profile", 
    onRevert 
}: ImageHistoryViewerProps) {
    const [history, setHistory] = useState<ImageHistoryItem[]>([]);
    const { getImageHistory, revertImage, loading, error } = useImageManagement();

    useEffect(() => {
        loadHistory();
    }, [userId, type]);

    const loadHistory = async () => {
        const historyData = await getImageHistory(userId, type);
        setHistory(historyData);
    };

    const handleRevert = async (item: ImageHistoryItem) => {
        const result = await revertImage(userId, item);
        if (result.success) {
            toast.success("Image reverted successfully!");
            loadHistory(); // Refresh history
            onRevert?.(item);
        } else {
            toast.error(result.error || "Failed to revert image");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "deleted": return "bg-red-100 text-red-800";
            case "pending": return "bg-yellow-100 text-yellow-800";
            case "failed": return "bg-red-100 text-red-800";
            case "kept": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading history...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-red-600 flex items-center">
                        <span className="mr-2">⚠️</span>
                        Error loading history: {error}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <History className="mr-2 h-5 w-5" />
                    Image History
                </CardTitle>
            </CardHeader>
            <CardContent>
                {history.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <ImageIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>No image history found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((item) => (
                            <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                                {/* Old Image */}
                                <div className="flex-shrink-0">
                                    <div className="text-xs text-gray-500 mb-1">Previous</div>
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={item.old_url} alt="Previous image" />
                                        <AvatarFallback>
                                            <User className="h-8 w-8" />
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                {/* Arrow */}
                                <div className="flex-shrink-0">
                                    <div className="text-gray-400">→</div>
                                </div>

                                {/* New Image */}
                                <div className="flex-shrink-0">
                                    <div className="text-xs text-gray-500 mb-1">Current</div>
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={item.new_url} alt="Current image" />
                                        <AvatarFallback>
                                            <User className="h-8 w-8" />
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                        {formatDate(item.replaced_at)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Type: {item.type}
                                    </div>
                                    {item.metadata?.file_name && (
                                        <div className="text-xs text-gray-400 truncate">
                                            {item.metadata.file_name}
                                        </div>
                                    )}
                                    <Badge className={`mt-1 ${getStatusColor(item.deletion_status)}`}>
                                        {item.deletion_status}
                                    </Badge>
                                </div>

                                {/* Actions */}
                                <div className="flex-shrink-0">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRevert(item)}
                                        className="flex items-center"
                                    >
                                        <RotateCcw className="h-4 w-4 mr-1" />
                                        Revert
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface ProfileImageUploaderProps {
    userId: string;
    currentImageUrl?: string | null;
    displayName?: string | null;
    onSuccess?: (newUrl: string) => void;
    type?: "profile" | "chat" | "banner" | "other";
}

export function ProfileImageUploader({ 
    userId, 
    currentImageUrl, 
    displayName,
    onSuccess,
    type = "profile"
}: ProfileImageUploaderProps) {
    const [dragActive, setDragActive] = useState(false);
    const { uploadImage, uploading, error, clearError } = useImageManagement();

    const handleFileSelect = async (file: File) => {
        clearError();
        
        const result = await uploadImage(userId, file, type, {
            deleteOld: false, // Keep old images for history
            keepHistory: 10   // Keep last 10 images
        });

        if (result.success && result.url) {
            toast.success("Image uploaded successfully!");
            onSuccess?.(result.url);
        } else {
            toast.error(result.error || "Failed to upload image");
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        
        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find(file => file.type.startsWith('image/'));
        
        if (imageFile) {
            handleFileSelect(imageFile);
        } else {
            toast.error("Please drop an image file");
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Upload className="mr-2 h-5 w-5" />
                    Upload {type === "profile" ? "Profile" : type} Image
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Current Image Preview */}
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={currentImageUrl || ""} alt="Current image" />
                            <AvatarFallback>
                                <User className="h-10 w-10" />
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="text-sm font-medium">
                                {displayName || "User"}
                            </div>
                            <div className="text-xs text-gray-500">
                                Current {type} image
                            </div>
                        </div>
                    </div>

                    {/* Upload Area */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`
                            border-2 border-dashed rounded-lg p-8 text-center transition-colors
                            ${dragActive 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-300 hover:border-gray-400'
                            }
                            ${uploading ? 'opacity-50 pointer-events-none' : ''}
                        `}
                    >
                        {uploading ? (
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                <p className="text-sm text-gray-600">Uploading...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600 mb-2">
                                    Drag and drop an image here, or click to select
                                </p>
                                <p className="text-xs text-gray-400">
                                    Supports JPEG, PNG, GIF, WebP (max 5MB)
                                </p>
                                
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileInput}
                                    className="hidden"
                                    id="image-upload"
                                    disabled={uploading}
                                />
                                <label htmlFor="image-upload">
                                    <Button 
                                        variant="outline" 
                                        className="mt-4 cursor-pointer"
                                        disabled={uploading}
                                        asChild
                                    >
                                        <span>Select Image</span>
                                    </Button>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="text-red-600 text-sm flex items-center">
                            <span className="mr-2">⚠️</span>
                            {error}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}