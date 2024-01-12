import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Movie {
  id: number;
  poster_path: string;
  title: string;
  release_date: string;
  vote_average: number;
}

// Interfaces for API results
export interface ApiResult {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number; 
}

export interface MovieDetails {}

@Injectable({ providedIn: 'root' })
export class MovieService {
  // Base URL and API key from the environment variables
  private baseUrl = environment.baseUrl;
  private apiKey = environment.apiKey;

  constructor(private http: HttpClient) {} // HTTP client injected for API requests

  // Generic method to fetch movies from different endpoints
  private getMovies(endpoint: string, paramsObject: any = {}): Observable<ApiResult> {
    let params = new HttpParams({ fromObject: { ...paramsObject, api_key: this.apiKey }});
    return this.http.get<ApiResult>(`${this.baseUrl}${endpoint}`, { params })
      .pipe(catchError(error => this.handleError<ApiResult>(error))); // Handle errors
  }

  // Fetch top rated movies
  getTopRatedMovies(page = 1): Observable<ApiResult> {
    return this.getMovies('/movie/popular', { page });
  }

  // Fetch details of a specific movie
  getMovieDetails(id: string): Observable<MovieDetails> {
    return this.getMovies(`/movie/${id}`)
      .pipe(catchError(error => this.handleError<MovieDetails>(error)));
  }
  
  // Fetch list of genres
  getGenres(): Observable<any> {
    return this.getMovies('/genre/movie/list');
  }

  // Search for movies based on a query
  searchMovies(query: string, page = 1): Observable<ApiResult> {
    return this.getMovies('/search/movie', { query, page });
  }
  
  // Discover movies based on filters
  discoverMovies(filters: { year?: number, genreIds?: number[], page?: number, query?: string }): Observable<ApiResult> {
    let params = {
      language: 'en-US',
      sort_by: 'popularity.desc',
      page: filters.page ?? 1,
      ...filters.year && { year: filters.year },
      ...filters.genreIds && { with_genres: filters.genreIds.join(',') },
      ...filters.query && { query: filters.query }
    };
    
    return this.getMovies('/discover/movie', params)
      .pipe(catchError(error => this.handleError<ApiResult>(error))); // Handle errors
  }

  // Generic error handler
  private handleError<T>(error: any, result?: T) {
    console.error('An error occurred:', error);
    return throwError(() => new Error('An error occurred, please try again later.'));
  }
}
