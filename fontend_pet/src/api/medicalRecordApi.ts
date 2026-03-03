const API_BASE_URL = 'http://localhost:8080/api';

export interface MedicalResponse {
    id: number;
    appointmentId: number;
    petName: string;
    imageUrl: string;
    petSpecies: string;
    diagnosis: string;
    treatment: string;
    prescription: string;
    notes: string;
    followUpDate: string;


}
export interface MedicalRequest {
    diagnosis: string;
    treatment: string;
    prescription: string;
    notes: string;
    followUpDate: string;
}

export const medicalRecordApi = {
    async getRecord(bookingCode: string): Promise<MedicalResponse[]>{
        const response = await fetch(`${API_BASE_URL}/medical/${bookingCode}`)
        console.log(response);
        if(!response.ok) throw new Error('Failed to fetch medical record');
        return response.json();
    },

    async saveRecord(appointmentId: number, data: MedicalRequest): Promise<MedicalResponse> {
        const response = await fetch(`${API_BASE_URL}/medical/${appointmentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if(!response.ok) throw new Error('Failed to save medical record');
        return response.json();
    }
}