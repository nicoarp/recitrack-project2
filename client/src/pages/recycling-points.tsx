import React, { useEffect, useState } from "react";
import { useLocation } from "wouter"; // Usando Wouter en lugar de react-router-dom
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";

export default function RecyclingPointsCRUD() {
  const [, navigate] = useLocation(); // Hook de Wouter

  const [recyclingPoints, setRecyclingPoints] = useState<any[]>([]);
  const [form, setForm] = useState({
    id: null as number | null,
    depositId: "",
    name: "",
    address: "",
    hours: "",
    acceptedItems: "",
  });
  const [loading, setLoading] = useState(false);

  // Obtener puntos desde API
  const fetchPoints = async () => {
    const res = await fetch("/api/recycling-points");
    const data = await res.json();
    setRecyclingPoints(data);
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  // Manejar formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ id: null, depositId: "", name: "", address: "", hours: "", acceptedItems: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      depositId: form.depositId,
      name: form.name,
      address: form.address,
      hours: form.hours,
      acceptedItems: form.acceptedItems.split(",").map((item) => item.trim()),
    };

    const url = form.id ? `/api/recycling-points/${form.id}` : "/api/recycling-points";
    const method = form.id ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (response.ok) {
      alert(form.id ? "Punto actualizado correctamente" : "Punto agregado correctamente");
      resetForm();
      fetchPoints();
    } else {
      alert("Error al guardar el punto");
    }
  };

  const handleEdit = (point: any) => {
    setForm({
      id: point.id,
      depositId: point.depositId,
      name: point.name,
      address: point.address,
      hours: point.hours,
      acceptedItems: point.acceptedItems.join(", "),
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este punto?")) return;

    const response = await fetch(`/api/recycling-points/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      alert("Punto eliminado correctamente");
      fetchPoints();
    } else {
      alert("Error al eliminar el punto");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Puntos de Reciclaje</h1>
          <p className="mt-2 text-gray-600">
            Administra los puntos de reciclaje. Crea, edita o elimina registros.
          </p>
        </div>
        {/* Botón para ir a la administración de QR */}
        <button
          onClick={() => navigate("/qr-admin")}
          className="text-blue-600 hover:underline text-sm"
        >
          Administrar QR
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <input
          type="text"
          name="depositId"
          placeholder="ID del punto (ej: PUNTO-001)"
          value={form.depositId}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="name"
          placeholder="Nombre"
          value={form.name}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="address"
          placeholder="Dirección"
          value={form.address}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="hours"
          placeholder="Horario"
          value={form.hours}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="acceptedItems"
          placeholder="Materiales (ej: Botellas PET, Latas)"
          value={form.acceptedItems}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-500 text-white p-2 rounded col-span-1 md:col-span-2"
        >
          {loading ? "Guardando..." : form.id ? "Actualizar punto" : "Agregar punto"}
        </button>
        {form.id && (
          <button
            type="button"
            onClick={resetForm}
            className="bg-gray-300 text-gray-700 p-2 rounded col-span-1 md:col-span-2"
          >
            Cancelar edición
          </button>
        )}
      </form>

      {/* Lista de puntos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recyclingPoints.map((point) => (
          <Card key={point.id}>
            <CardHeader className="bg-primary-50 pb-2 flex justify-between items-center">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-primary-500 mr-2" />
                {point.name}
              </CardTitle>
              <div className="space-x-2">
                <button
                  onClick={() => handleEdit(point)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(point.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Eliminar
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700">
                <span className="font-medium">Dirección: </span>
                {point.address}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Horario: </span>
                {point.hours}
              </p>
              <div>
                <p className="font-medium text-gray-700">Materiales aceptados:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {point.acceptedItems.map((item: string, index: number) => (
                    <span
                      key={index}
                      className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
