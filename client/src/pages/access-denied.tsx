import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-lg bg-red-100 text-red-600 mb-4">
            <FontAwesomeIcon icon="user-circle" className="text-2xl" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Acceso Restringido
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            No tienes permisos para acceder a esta página. 
            Esta sección está reservada para administradores.
          </p>
          
          <div className="space-y-3">
            <Link href="/login">
              <Button className="w-full bg-primary-500 hover:bg-primary-600">
                <FontAwesomeIcon icon="user-circle" className="mr-2" />
                Iniciar Sesión como Admin
              </Button>
            </Link>
            
            <Link href="/">
              <Button variant="outline" className="w-full">
                <FontAwesomeIcon icon="home" className="mr-2" />
                Volver al Inicio
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 pt-6 border-t text-xs text-gray-500">
            <p>Si necesitas acceso administrativo, contacta al administrador del sistema.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}