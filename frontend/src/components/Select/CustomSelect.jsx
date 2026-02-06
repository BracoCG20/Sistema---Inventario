import React from 'react';
import Select from 'react-select';

const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder,
  isDisabled,
}) => {
  // Estilos personalizados para inyectar en React-Select
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      background: 'rgba(255, 255, 255, 0.9)', // Fondo Glass
      borderColor: state.isFocused ? '#7c3aed' : '#cbd5e1', // Borde morado al enfocar
      borderRadius: '10px',
      padding: '5px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(124, 58, 237, 0.1)' : 'none', // Halo morado
      cursor: 'pointer',
      fontSize: '0.95rem',
      '&:hover': {
        borderColor: '#7c3aed',
      },
    }),
    menu: (provided) => ({
      ...provided,
      background: 'rgba(255, 255, 255, 0.95)', // Fondo del menú desplegable
      backdropFilter: 'blur(10px)',
      borderRadius: '10px',
      zIndex: 9999, // Importante para que flote sobre todo
      border: '1px solid rgba(0,0,0,0.1)',
      overflow: 'hidden',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#7c3aed' // Morado si está seleccionado
        : state.isFocused
          ? 'rgba(124, 58, 237, 0.1)' // Morado clarito al pasar el mouse
          : 'transparent',
      color: state.isSelected ? 'white' : '#1e293b',
      cursor: 'pointer',
      padding: '10px 15px',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b', // Color del texto seleccionado
      fontWeight: '500',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
    }),
    input: (provided) => ({
      ...provided,
      color: '#1e293b',
    }),
  };

  return (
    <Select
      styles={customStyles}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isClearable // Permite borrar la selección con una 'x'
      isSearchable // Permite escribir para buscar
      noOptionsMessage={() => 'No se encontraron resultados'}
    />
  );
};

export default CustomSelect;
