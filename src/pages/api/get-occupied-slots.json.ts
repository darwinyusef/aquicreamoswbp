import type { APIRoute } from 'astro';
import { appointmentsDb } from '../../lib/db';

export const GET: APIRoute = async () => {
  try {
    const occupiedSlots = appointmentsDb.getOccupiedSlots();

    return new Response(
      JSON.stringify({
        success: true,
        data: occupiedSlots,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching occupied slots:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error al obtener los horarios ocupados',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
