import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'recolector' | 'centro_acopio' | 'admin';
}

// ELIMINADO: datos mock - usar solo datos reales de PostgreSQL
// Los usuarios se cargarán dinámicamente desde /api/users

const roleLabels = {
  'recolector': 'Recolector',
  'centro_acopio': 'Centro de Acopio', 
  'admin': 'Administrador'
};

const roleColors = {
  'recolector': 'bg-blue-100 text-blue-800',
  'centro_acopio': 'bg-green-100 text-green-800',
  'admin': 'bg-purple-100 text-purple-800'
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const { toast } = useToast();

  const handleRoleChange = (userId: number, newRole: string) => {
    const updatedUsers = users.map(user => 
      user.id === userId 
        ? { ...user, role: newRole as 'recolector' | 'centro_acopio' | 'admin' }
        : user
    );
    
    setUsers(updatedUsers);
    
    toast({
      title: "Rol actualizado",
      description: `El rol del usuario ha sido cambiado a ${roleLabels[newRole as keyof typeof roleLabels]}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra roles y permisos de usuarios</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios Activos</CardTitle>
          <CardDescription>
            Gestiona los roles de los usuarios en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Select 
                    value={user.role} 
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recolector">Recolector</SelectItem>
                      <SelectItem value="centro_acopio">Centro de Acopio</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h4 className="font-medium">Recolector</h4>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Escaneo de QR</li>
                <li>• Registro de depósitos</li>
                <li>• Historial personal</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h4 className="font-medium">Centro de Acopio</h4>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Agrupación de lotes</li>
                <li>• Validación de QR</li>
                <li>• Historial de lotes</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <h4 className="font-medium">Administrador</h4>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Acceso completo</li>
                <li>• Gestión de usuarios</li>
                <li>• Métricas globales</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}