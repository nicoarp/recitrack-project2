/**
 * MINI-ERP: Componente de gestión de documentos
 * Funcionalidad exclusiva para usuarios con rol 'centro_acopio'
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  FileText, 
  Upload, 
  Download, 
  Search, 
  Filter, 
  Trash2, 
  Eye,
  Calendar,
  User,
  FileCheck,
  AlertCircle,
  Package
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Schema para el formulario de subida de documentos
const uploadDocumentSchema = z.object({
  documentType: z.enum(['boleta', 'guia', 'certificado', 'contrato', 'otro'], {
    required_error: "Tipo de documento requerido"
  }),
  description: z.string().optional(),
  tags: z.string().optional(),
  batchId: z.string().optional(),
  isPublic: z.boolean().default(false),
  file: z.any().refine((file) => file && file.length > 0, "Archivo requerido")
});

type UploadDocumentFormData = z.infer<typeof uploadDocumentSchema>;

interface Document {
  id: number;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  documentType: string;
  description?: string;
  tags: string[];
  batchId?: number;
  isPublic: boolean;
  status: string;
  uploaderName?: string;
  createdAt: string;
  updatedAt: string;
}

interface DocumentStats {
  totalDocuments: number;
  documentsByType: Array<{ documentType: string; count: number }>;
  supportedTypes: string[];
}

const DOCUMENT_TYPE_LABELS = {
  boleta: 'Boleta',
  guia: 'Guía de Despacho',
  certificado: 'Certificado',
  contrato: 'Contrato',
  otro: 'Otro'
};

const DOCUMENT_TYPE_COLORS = {
  boleta: 'bg-blue-100 text-blue-800',
  guia: 'bg-green-100 text-green-800',
  certificado: 'bg-purple-100 text-purple-800',
  contrato: 'bg-orange-100 text-orange-800',
  otro: 'bg-gray-100 text-gray-800'
};

export function DocumentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    documentType: '',
    search: '',
    batchId: ''
  });

  // Query para obtener documentos
  const { data: documents = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.documentType) params.append('documentType', filters.documentType);
      if (filters.search) params.append('search', filters.search);
      if (filters.batchId) params.append('batchId', filters.batchId);
      
      const response = await apiRequest(`/api/documents?${params.toString()}`);
      return response.documents || [];
    }
  });

  // Query para estadísticas
  const { data: stats } = useQuery<DocumentStats>({
    queryKey: ['/api/documents/stats'],
    queryFn: async () => {
      return await apiRequest('/api/documents/stats');
    }
  });

  // Formulario de subida
  const uploadForm = useForm<UploadDocumentFormData>({
    resolver: zodResolver(uploadDocumentSchema),
    defaultValues: {
      documentType: 'boleta',
      description: '',
      tags: '',
      batchId: '',
      isPublic: false
    }
  });

  // Mutación para subir documentos
  const uploadMutation = useMutation({
    mutationFn: async (data: UploadDocumentFormData) => {
      const formData = new FormData();
      formData.append('file', data.file[0]);
      formData.append('documentType', data.documentType);
      if (data.description) formData.append('description', data.description);
      if (data.tags) formData.append('tags', data.tags);
      if (data.batchId) formData.append('batchId', data.batchId);
      formData.append('isPublic', data.isPublic.toString());

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'x-user-id': localStorage.getItem('recitrack_user_id') || '1'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir documento');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/stats'] });
      setUploadDialogOpen(false);
      uploadForm.reset();
      toast({
        title: "Documento subido",
        description: "El documento se ha subido exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al subir documento",
        variant: "destructive",
      });
    }
  });

  // Función para descargar documento
  const downloadDocument = async (documentId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`, {
        headers: {
          'x-user-id': localStorage.getItem('recitrack_user_id') || '1'
        }
      });

      if (!response.ok) {
        throw new Error('Error al descargar documento');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Descarga iniciada",
        description: `Descargando ${fileName}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo descargar el documento",
        variant: "destructive",
      });
    }
  };

  // Mutación para eliminar documento
  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      return await apiRequest(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': localStorage.getItem('recitrack_user_id') || '1'
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/stats'] });
      toast({
        title: "Documento eliminado",
        description: "El documento se ha eliminado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar documento",
        variant: "destructive",
      });
    }
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Documentos</h1>
            <p className="text-gray-600 mt-1">Administra documentos asociados a lotes y movimientos</p>
          </div>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                Subir Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Subir Nuevo Documento</DialogTitle>
                <DialogDescription>
                  Selecciona un archivo y completa la información del documento
                </DialogDescription>
              </DialogHeader>
              
              <Form {...uploadForm}>
                <form onSubmit={uploadForm.handleSubmit((data) => uploadMutation.mutate(data))} 
                      className="space-y-4">
                  
                  <FormField
                    control={uploadForm.control}
                    name="file"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Archivo</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                            onChange={(e) => field.onChange(e.target.files)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={uploadForm.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Documento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={uploadForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción (opcional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe el contenido del documento..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={uploadForm.control}
                    name="batchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID de Lote (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: 12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={uploadForm.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Etiquetas (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="urgente, revision, aprobado (separadas por comas)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={uploadMutation.isPending}>
                      {uploadMutation.isPending ? 'Subiendo...' : 'Subir Documento'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Documentos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {stats.documentsByType.slice(0, 3).map((type) => (
              <Card key={type.documentType}>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <FileCheck className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        {DOCUMENT_TYPE_LABELS[type.documentType as keyof typeof DOCUMENT_TYPE_LABELS]}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">{type.count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Lista de Documentos</TabsTrigger>
          <TabsTrigger value="search">Búsqueda Avanzada</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Filtros básicos */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={filters.documentType} onValueChange={(value) => setFilters(prev => ({...prev, documentType: value}))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los tipos</SelectItem>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Buscar por nombre..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
              className="w-64"
            />
            
            <Input
              placeholder="Filtrar por lote..."
              value={filters.batchId}
              onChange={(e) => setFilters(prev => ({...prev, batchId: e.target.value}))}
              className="w-48"
            />
          </div>

          {/* Lista de documentos */}
          <div className="space-y-4">
            {documentsLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Cargando documentos...</p>
              </div>
            ) : documents.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay documentos</h3>
                  <p className="mt-1 text-sm text-gray-500">Comienza subiendo tu primer documento.</p>
                </CardContent>
              </Card>
            ) : (
              documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.originalName}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {doc.description || 'Sin descripción'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(doc.createdAt)}
                          </div>
                          {doc.uploaderName && (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {doc.uploaderName}
                            </div>
                          )}
                          <span>{formatFileSize(doc.fileSize)}</span>
                          {doc.batchId && (
                            <div className="flex items-center">
                              <Package className="h-4 w-4 mr-1" />
                              Lote {doc.batchId}
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {doc.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3 ml-4">
                        <Badge className={DOCUMENT_TYPE_COLORS[doc.documentType as keyof typeof DOCUMENT_TYPE_COLORS]}>
                          {DOCUMENT_TYPE_LABELS[doc.documentType as keyof typeof DOCUMENT_TYPE_LABELS]}
                        </Badge>
                        
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadDocument(doc.id, doc.originalName)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteMutation.mutate(doc.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Búsqueda Avanzada</CardTitle>
              <CardDescription>
                Funcionalidad de búsqueda avanzada en desarrollo. 
                Proximamente podrás buscar por fechas, tamaños y metadatos específicos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Search className="mx-auto h-12 w-12 mb-4" />
                <p>Búsqueda avanzada disponible en próxima actualización</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}