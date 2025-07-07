import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'wouter';

export default function Help() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Centro de Ayuda</h1>
        <p className="text-gray-600">Encuentra respuestas a las preguntas más frecuentes sobre Recitrack</p>
      </div>

      <div className="grid gap-6">
        {/* Preguntas Frecuentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FontAwesomeIcon icon="history" className="mr-2 text-primary-500" />
              Preguntas Frecuentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">¿Cómo registro botellas recicladas?</h3>
              <p className="text-gray-600">Escanea el código QR en el punto de reciclaje con la cámara de tu teléfono. Esto abrirá automáticamente el formulario con la ubicación ya completada.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">¿Dónde encuentro los códigos QR?</h3>
              <p className="text-gray-600">Los códigos QR están ubicados en los puntos de reciclaje oficiales. Busca contenedores identificados con el logo de EcoTraza.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">¿Por qué necesito escanear un QR?</h3>
              <p className="text-gray-600">El sistema QR garantiza la autenticidad de los depósitos y evita registros falsos, manteniendo la integridad de la cadena de reciclaje.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">¿Puedo ver mi historial de reciclaje?</h3>
              <p className="text-gray-600">Sí, una vez que inicies sesión podrás ver todo tu historial de depósitos y tu impacto ambiental acumulado.</p>
            </div>
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FontAwesomeIcon icon="user-circle" className="mr-2 text-primary-500" />
              Contacto y Soporte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button className="bg-green-500 hover:bg-green-600">
                <FontAwesomeIcon icon="user-circle" className="mr-2" />
                WhatsApp Soporte
              </Button>
              <span className="text-gray-600">Respuesta en menos de 24 horas</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline">
                <FontAwesomeIcon icon="user-circle" className="mr-2" />
                Email: soporte@ecotraza.com
              </Button>
              <span className="text-gray-600">Para consultas técnicas</span>
            </div>
          </CardContent>
        </Card>

        {/* Proceso de Reciclaje */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FontAwesomeIcon icon="recycle" className="mr-2 text-primary-500" />
              Proceso de Reciclaje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-semibold">Busca un punto de reciclaje</h4>
                  <p className="text-gray-600 text-sm">Encuentra contenedores oficiales con el logo de Recitrack</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-semibold">Escanea el código QR</h4>
                  <p className="text-gray-600 text-sm">Usa la cámara de tu teléfono para escanear el código</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-semibold">Registra tus botellas</h4>
                  <p className="text-gray-600 text-sm">Indica la cantidad de botellas que estás reciclando</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <h4 className="font-semibold">Confirma el registro</h4>
                  <p className="text-gray-600 text-sm">Tu depósito queda registrado permanentemente en blockchain</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navegación */}
        <div className="text-center">
          <Link href="/">
            <Button variant="outline">
              <FontAwesomeIcon icon="home" className="mr-2" />
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}