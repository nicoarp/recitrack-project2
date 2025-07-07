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
      // Redirigir al dashboard principal después del login exitoso
      setLocation('/');
    } catch (error) {
      toast({
        title: "Error de autenticación",
        description: "Credenciales incorrectas. Verifica tu email y contraseña.",
        variant: "destructive",
      });
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-lg bg-primary-500 text-white mb-4">
            <FontAwesomeIcon icon="recycle" className="text-xl" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Iniciar Sesión en Recitrack
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
            <h3 className="text-sm font-medium text-gray-700 mb-3">🔍 Cuentas de Demostración:</h3>
            <div className="space-y-2 text-xs">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <strong className="text-blue-700">Recolector</strong>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs border-blue-300 text-blue-600 hover:bg-blue-100"
                    onClick={() => fillDemoAccount('recolector@recitrack.com', 'recolector123')}
                  >
                    Usar
                  </Button>
                </div>
                <div className="text-gray-600">
                  📧 recolector@recitrack.com<br />
                  🔑 recolector123<br />
                  <span className="text-xs text-blue-600">• Escaneo QR • Depósitos • Historial personal</span>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <strong className="text-green-700">Centro de Acopio</strong>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs border-green-300 text-green-600 hover:bg-green-100"
                    onClick={() => fillDemoAccount('acopio@recitrack.com', 'acopio123')}
                  >
                    Usar
                  </Button>
                </div>
                <div className="text-gray-600">
                  📧 acopio@recitrack.com<br />
                  🔑 acopio123<br />
                  <span className="text-xs text-green-600">• Agrupación lotes • Validación • Historial lotes</span>
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <strong className="text-purple-700">Administrador</strong>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs border-purple-300 text-purple-600 hover:bg-purple-100"
                    onClick={() => fillDemoAccount('admin@recitrack.com', 'admin123')}
                  >
                    Usar
                  </Button>
                </div>
                <div className="text-gray-600">
                  📧 admin@recitrack.com<br />
                  🔑 admin123<br />
                  <span className="text-xs text-purple-600">• Acceso completo • Gestión usuarios • Métricas</span>
                </div>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
              💡 <strong>Tip:</strong> Cada rol muestra diferentes opciones en el menú de navegación
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}