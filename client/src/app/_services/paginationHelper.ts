import { HttpParams, HttpResponse } from "@angular/common/http";
import { Member } from "../_models/member";
import { PaginatedResult } from "../_models/pagination";
import { signal } from "@angular/core";

export function setPaginatedResponse<T>(
  response: HttpResponse<T>,
  paginatedResultSignal: ReturnType<typeof signal<PaginatedResult<T> | null>>
): PaginatedResult<T> {
  const result: PaginatedResult<T> = {
    items: response.body as T,
    pagination: JSON.parse(response.headers.get('Pagination')!)
  };
  paginatedResultSignal.set(result);
  return result;
}


  export function setPaginationHeader(pageNumber : number , pageSize : number) {
    let params = new HttpParams();
    params = params.append('pageNumber', pageNumber);
    params = params.append('pageSize', pageSize);
    return params;

  }
