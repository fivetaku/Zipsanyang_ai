export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const response = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText || response.statusText}`);
  }

  return response;
}

export async function uploadCSVData(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload/csv', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('CSV 업로드에 실패했습니다.');
  }

  return response.json();
}

export async function getApartmentDetails(complexNo: number) {
  const response = await apiRequest('GET', `/api/apartments/${complexNo}`);
  return response.json();
}

export async function searchApartments(params: {
  minPrice?: number;
  maxPrice?: number;
  sigungu?: string;
  purpose?: 'residence' | 'gap_investment';
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });

  const response = await apiRequest('GET', `/api/apartments/search?${searchParams}`);
  return response.json();
}
