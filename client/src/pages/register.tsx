import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const { registerWithEmail, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error de validación",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error de validación",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      await registerWithEmail(email, password, name);
      toast({
        title: "¡Cuenta creada exitosamente!",
        description: "Ya puedes comenzar a registrar tus depósitos de reciclaje.",
      });
      // Redirigir al perfil después del registro exitoso
      setLocation('/profile');
    } catch (error) {
      toast({
        title: "Error al crear cuenta",
        description: error instanceof Error ? error.message : "No se pudo crear la cuenta.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-lg bg-primary-500 text-white mb-4">
            <FontAwesomeIcon icon="user-plus" className="text-xl" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Crear cuenta nueva
          </CardTitle>
          <p className="text-gray-600">
            Únete a EcoTraza y comienza a rastrear tu impacto ambiental
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                className="w-full"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary-500 hover:bg-primary-600"
              disabled={isLoading}
            >
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <button
                onClick={() => setLocation('/login')}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Inicia sesión aquí
              </button>
            </p>
          </div>

          <div className="mt-6 border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Al crear una cuenta podrás:</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center">
                <FontAwesomeIcon icon="check" className="text-green-500 mr-2" />
                Rastrear tus botellas recicladas en tiempo real
              </div>
              <div className="flex items-center">
                <FontAwesomeIcon icon="check" className="text-green-500 mr-2" />
                Ver tu historial completo de depósitos
              </div>
              <div className="flex items-center">
                <FontAwesomeIcon icon="check" className="text-green-500 mr-2" />
                Calcular tu impacto ambiental personal
              </div>
              <div className="flex items-center">
                <FontAwesomeIcon icon="check" className="text-green-500 mr-2" />
                Obtener logros basados en tu actividad real
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}