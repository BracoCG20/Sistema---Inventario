import React from 'react';
import {
  FaSave,
  FaEnvelope,
  FaWhatsapp,
  FaLaptop,
  FaUser,
} from 'react-icons/fa';
import CustomSelect from '../Select/CustomSelect';

const EntregaForm = ({
  equiposOptions,
  usuariosOptions,
  formData,
  setFormData,
  onAction,
}) => {
  // Validar si el formulario está listo
  const isFormValid = formData.equipo_id && formData.empleado_id;

  return (
    <div className='form-card'>
      {/* INPUT EQUIPO */}
      <div className='input-group'>
        <label>
          <FaLaptop /> Equipo (Disponibles)
        </label>
        <CustomSelect
          options={equiposOptions}
          value={
            equiposOptions.find((op) => op.value === formData.equipo_id) || null
          }
          onChange={(op) =>
            setFormData({ ...formData, equipo_id: op?.value || '' })
          }
          placeholder='Seleccione un equipo...'
        />
      </div>

      {/* INPUT COLABORADOR */}
      <div className='input-group'>
        <label>
          <FaUser /> Colaborador (Sin equipo)
        </label>
        <CustomSelect
          options={usuariosOptions}
          value={
            usuariosOptions.find((op) => op.value === formData.empleado_id) ||
            null
          }
          onChange={(op) =>
            setFormData({ ...formData, empleado_id: op?.value || '' })
          }
          placeholder='Seleccione un colaborador...'
        />
      </div>

      {/* CHECKBOX CARGADOR (Estilo Rosado/Violeta según SCSS) */}
      <label className='checkbox-card'>
        <input
          type='checkbox'
          checked={formData.cargador}
          onChange={(e) =>
            setFormData({ ...formData, cargador: e.target.checked })
          }
        />
        <span>¿Incluye Cargador?</span>
      </label>

      {/* BOTONES */}
      <div className='actions-container'>
        <button
          type='button'
          onClick={() => onAction('GUARDAR')}
          className='btn-action gray'
          disabled={!isFormValid}
        >
          <FaSave /> Solo Guardar y Ver Acta
        </button>

        <button
          type='button'
          onClick={() => onAction('EMAIL')}
          className='btn-action blue'
          disabled={!isFormValid}
        >
          <FaEnvelope /> Guardar y Enviar por Correo
        </button>

        <button
          type='button'
          onClick={() => onAction('WHATSAPP')}
          className='btn-action green'
          disabled={!isFormValid}
        >
          <FaWhatsapp style={{ fontSize: '1.3rem' }} /> Guardar y Enviar por
          WhatsApp
        </button>
      </div>
    </div>
  );
};

export default EntregaForm;
