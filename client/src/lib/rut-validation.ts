// Utilidades para validación de RUT chileno

export function formatRut(rut: string): string {
  // Eliminar caracteres no válidos
  const cleanRut = rut.replace(/[^0-9kK]/g, '');
  
  if (cleanRut.length < 2) {
    return cleanRut;
  }
  
  // Separar número y dígito verificador
  const rutNumber = cleanRut.slice(0, -1);
  const checkDigit = cleanRut.slice(-1).toUpperCase();
  
  // Formatear con puntos y guión
  const formatted = rutNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formatted}-${checkDigit}`;
}

export function validateRut(rut: string): boolean {
  // Limpiar RUT
  const cleanRut = rut.replace(/[^0-9kK]/g, '');
  
  if (cleanRut.length < 8 || cleanRut.length > 9) {
    return false;
  }
  
  // Separar número y dígito verificador
  const rutNumber = cleanRut.slice(0, -1);
  const checkDigit = cleanRut.slice(-1).toUpperCase();
  
  // Validar que el número sea válido
  if (!/^\d+$/.test(rutNumber)) {
    return false;
  }
  
  // Calcular dígito verificador
  const calculatedDigit = calculateCheckDigit(rutNumber);
  
  return calculatedDigit === checkDigit;
}

function calculateCheckDigit(rutNumber: string): string {
  let sum = 0;
  let multiplier = 2;
  
  // Recorrer desde derecha a izquierda
  for (let i = rutNumber.length - 1; i >= 0; i--) {
    sum += parseInt(rutNumber[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const checkDigit = 11 - remainder;
  
  if (checkDigit === 11) {
    return '0';
  } else if (checkDigit === 10) {
    return 'K';
  } else {
    return checkDigit.toString();
  }
}

export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '');
}

// Hook para input de RUT con formato automático
export function useRutInput() {
  const handleRutChange = (value: string) => {
    return formatRut(value);
  };
  
  const isValidRut = (value: string) => {
    return validateRut(value);
  };
  
  return {
    handleRutChange,
    isValidRut,
    formatRut,
    cleanRut
  };
}