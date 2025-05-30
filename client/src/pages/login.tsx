import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginWithEmail, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente.",
      });
      // Redirigir al perfil después del login exitoso
      setLocation('/profile');
    } catch (error) {
      toast({
        title: "Error de autenticación",
        description: "Credenciales incorrectas. Verifica tu email y contraseña.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-lg bg-primary-500 text-white mb-4">
            <FontAwesomeIcon icon="recycle" className="text-xl" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Iniciar Sesión en EcoTraza
          </CardTitle>
          <p className="text-gray-600">
            Accede a tu cuenta para gestionar tus depósitos de reciclaje
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary-500 hover:bg-primary-600"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <button
                onClick={() => setLocation('/register')}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Créala aquí
              </button>
            </p>
          </div>

          <div className="mt-6 border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Cuentas de demostración:</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="bg-gray-50 p-2 rounded">
                <strong>Administrador:</strong><br />
                Email: admin@ecotraza.com<br />
                Contraseña: admin123
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <strong>Usuario:</strong><br />
                Email: user@example.com<br />
                Contraseña: user123
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}