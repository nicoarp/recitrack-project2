import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Camera, Scale, Package, User } from 'lucide-react';
import { Link } from 'wouter';

// Esquema de validación para el formulario
const depositManualSchema = z.object({
  tipo_material: z.string().min(1, "Seleccione un tipo de material"),
  weightKg: z.number().positive("El peso debe ser mayor a 0").max(1000, "El peso no puede exceder 1000 kg"),
  donante_nombre: z.string().optional(),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
  location: z.string().min(1, "Ubicación es requerida"),
  depositId: z.string().min(1, "ID del punto de depósito es requerido"),
});

type DepositManualForm = z.infer<typeof depositManualSchema>;

const TIPOS_MATERIALES = [
  { value: 'PET', label: 'PET - Botellas plásticas' },
  { value: 'HDPE', label: 'HDPE - Envases de limpieza' },
  { value: 'LDPE', label: 'LDPE - Bolsas plásticas' },
  { value: 'PP', label: 'PP - Tapas y envases' },
  { value: 'PS', label: 'PS - Vasos desechables' },
  { value: 'ALUMINIO', label: 'Aluminio - Latas' },
  { value: 'VIDRIO', label: 'Vidrio - Botellas' },
  { value: 'PAPEL', label: 'Papel y cartón' },
  { value: 'MIXTO', label: 'Materiales mixtos' },
];

export default function DepositManual() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const form = useForm<DepositManualForm>({
    resolver: zodResolver(depositManualSchema),
    defaultValues: {
      tipo_material: '',
      weightKg: 0,
      donante_nombre: '',
      notes: '',
      photos: [],
      location: `Centro de Acopio ${user?.name || 'Principal'}`,
      depositId: 'MANUAL-' + Date.now().toString().slice(-6),
    },
  });

  const createDepositMutation = useMutation({
    mutationFn: async (data: DepositManualForm) => {
      return await apiRequest('/api/deposit-manual', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Depósito registrado exitosamente",
        description: "El depósito manual ha sido registrado en el sistema.",
      });
      form.reset();
      setPhotos([]);
      queryClient.invalidateQueries({ queryKey: ['/api/deposit-manual/history'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al registrar depósito",
        description: error.response?.data?.error || "Error interno del servidor",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newPhotos: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Archivo muy grande",
          description: `${file.name} excede el límite de 10MB`,
          variant: "destructive",
        });
        continue;
      }

      try {
        const compressedDataUrl = await compressImage(file);
        newPhotos.push(compressedDataUrl);
      } catch (error) {
        toast({
          title: "Error al procesar imagen",
          description: `No se pudo procesar ${file.name}`,
          variant: "destructive",
        });
      }
    }

    setPhotos(prev => [...prev, ...newPhotos]);
    form.setValue('photos', [...photos, ...newPhotos]);
    setUploading(false);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const maxWidth = 1024;
        const maxHeight = 1024;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    form.setValue('photos', newPhotos);
  };

  const onSubmit = (data: DepositManualForm) => {
    createDepositMutation.mutate({
      ...data,
      photos: photos
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Registrar Depósito Manual</h1>
          <p className="text-muted-foreground">
            Registra material de donantes sin código QR
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Nuevo Depósito Manual
          </CardTitle>
          <CardDescription>
            Complete todos los campos para registrar un depósito de material reciclable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="tipo_material"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Tipo de Material *
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el tipo de material" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIPOS_MATERIALES.map((material) => (
                            <SelectItem key={material.value} value={material.value}>
                              {material.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        Peso (kg) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="1000"
                          placeholder="Ej: 15.5"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Peso total del material en kilogramos
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="donante_nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nombre del Donante
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Juan Pérez (opcional)"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Nombre del donante o "Anónimo" si no se especifica
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ubicación del centro de acopio"
                          {...field}
                          readOnly
                          className="bg-blue-50 border-blue-200"
                        />
                      </FormControl>
                      <FormDescription>
                        Ubicación automática del centro de acopio
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones adicionales sobre el depósito..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Información adicional sobre el estado del material, calidad, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Evidencia Fotográfica
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Camera className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Haga clic para agregar fotos del material
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG hasta 10MB cada una
                    </p>
                  </label>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`Evidencia ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={createDepositMutation.isPending || uploading}
                  className="flex-1"
                >
                  {createDepositMutation.isPending ? 'Registrando...' : 'Registrar Depósito'}
                </Button>
                <Link href="/dashboard">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}