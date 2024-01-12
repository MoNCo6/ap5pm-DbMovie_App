import { Component, OnInit } from '@angular/core';
import { InfiniteScrollCustomEvent, LoadingController, ToastController } from '@ionic/angular';
import { MovieService } from 'src/app/services/movie.service';
import { environment } from 'src/environments/environment';

// Interface defining the structure of a Movie object
interface Movie {
  id: number;
  poster_path: string;
  title: string;
  release_date: string;
  vote_average: number;
}

@Component({
  selector: 'app-movies',
  templateUrl: './movies.page.html',
  styleUrls: ['./movies.page.scss'],
})
export class MoviesPage implements OnInit {
  // Component properties
  movies: Movie[] = []; // Array to store movie objects
  displayedMovies: Movie[] = []; // Array to store movies displayed on the page
  genres: any[] = []; // Array to store genres from the API
  selectedGenres: number[] = []; // Array to store user-selected genres for filtering
  currentPage = 1; // Current pagination page
  imageBaseUrl = environment.images; // Base URL for images
  splash = true; // Flag to control the splash screen visibility
  selectedYears: number[] = []; // Array to store user-selected years for filtering
  years: number[] = this.generateYearsArray(1990, new Date().getFullYear()); // Array of years for the filter
  searchTerm: string = ''; // Search term for searching movies

  constructor(
    private movieService: MovieService, // Service to handle API requests
    private loadingCtrl: LoadingController, // Controller for handling loading indicators
    private toastCtrl: ToastController // Controller for showing toast notifications
  ) {}

  ngOnInit() {
    // Initialize component
    this.loadGenres(); // Load genre list on component initialization
    this.initialLoadMovies(); // Perform an initial load of movies
    setTimeout(() => { this.splash = false; }, 4000); // Hide splash screen after 4 seconds
  }

  async initialLoadMovies() {
    // Function to load movies initially
    this.currentPage = 1; // Set current page to 1 for initial load
    await this.loadFilteredMovies(); // Load movies with any active filters
  }

  async loadFilteredMovies(event?: InfiniteScrollCustomEvent) {
    // Function to load movies based on current filters
    const loading = await this.loadingCtrl.create({
      message: 'Loading Movies...',
      spinner: 'bubbles',
    });
    await loading.present(); // Display the loading indicator

    try {
      let newMovies: Movie[] = []; // Array to store newly fetched movies
      // Determine the fetch method based on whether there's a search term
      const movieFetchPromise = this.searchTerm
        ? this.movieService.searchMovies(this.searchTerm, this.currentPage).toPromise()
        : this.movieService.discoverMovies({
            year: this.selectedYears.length ? this.selectedYears[0] : undefined,
            genreIds: this.selectedGenres,
            page: this.currentPage,
          }).toPromise();

      const searchResults = await movieFetchPromise; // Await the results of the fetch
      
      // Check if search results are valid and assign new movies accordingly
      if (searchResults && searchResults.results) {
        newMovies = searchResults.results;

        // Filter movies by selected years, if any
        if (this.selectedYears.length > 0) {
          newMovies = newMovies.filter(movie => 
            this.selectedYears.includes(new Date(movie.release_date).getFullYear())
          );
        }
      }

      // Combine newly fetched movies with existing ones
      this.movies = event ? [...this.movies, ...newMovies] : newMovies;
      this.displayedMovies = this.movies; // Update displayed movies list

    } catch (error) {
      console.error('Error loading filtered movies:', error); // Log any errors
      this.presentToast('Error loading movies. Please try again later.'); // Display error toast
    } finally {
      loading.dismiss(); // Dismiss the loading indicator
      if (event) event.target.complete(); // Complete the infinite scroll event if present
    }
  }

  // Function to handle loading more movies when the user scrolls
  loadMore(event: InfiniteScrollCustomEvent) {
    this.currentPage++; // Increment the current page
    this.loadFilteredMovies(event); // Load more movies
  }

  // Function to load available movie genres
  loadGenres() {
    this.movieService.getGenres().subscribe(response => {
      this.genres = response.genres; // Assign fetched genres to the genres array
    }, error => {
      console.error('Error loading genres:', error); // Log errors
      this.presentToast('Error loading genres. Please try again later.'); // Show error toast
    });
  }

  // Function to handle changes in genre selection
  onGenreChange() {
    this.currentPage = 1; // Reset to first page
    this.movies = []; // Clear existing movies
    this.displayedMovies = []; // Clear displayed movies
    this.loadFilteredMovies(); // Reload movies with new genre filter
  }

  // Function to handle search operations
  async onSearch() {
    this.currentPage = 1; // Vždy začnite od prvej stránky pri novom vyhľadávaní
  
    if (!this.searchTerm.trim()) {
      // Ak je vyhľadávací reťazec prázdny, resetujte a načítajte filmy
      this.movies = [];
      this.displayedMovies = [];
      await this.loadFilteredMovies(); // Načítajte filmy bez vyhľadávacieho reťazca
    } else {
      // Ak existuje vyhľadávací reťazec, vykonajte vyhľadávanie
      const loading = await this.loadingCtrl.create({
        message: 'Searching Movies...',
        spinner: 'bubbles',
      });
      await loading.present(); // Zobrazte indikátor načítania
  
      try {
        const res = await this.movieService.searchMovies(this.searchTerm, this.currentPage).toPromise();
        this.movies = res && res.results ? res.results.filter(movie => movie.title.toLowerCase().includes(this.searchTerm.toLowerCase())) : [];
        this.displayedMovies = this.movies;
      } catch (error) {
        console.error('Error searching movies:', error); // Zaznamenajte chyby
        this.presentToast('Error searching movies. Please try again later.'); // Zobrazte chybový toast
      } finally {
        loading.dismiss(); // Odstráňte indikátor načítania
      }
    }
  }
  

  // Utility function to generate an array of years
  generateYearsArray(startYear: number, endYear: number): number[] {
    let years = []; // Array to store years
    for (let year = startYear; year <= endYear; year++) {
      years.push(year); // Push each year to the array
    }
    return years.reverse(); // Return the array in descending order
  }

  // Function to apply selected filters
  applyFilter(filterType: string, values: any[]) {
    if (filterType === 'year') {
      // If the filter type is 'year'
      this.selectedYears = values; // Update the selected years
      this.loadFilteredMovies(); // Reload movies with new year filter
    } else {
      console.log('Unknown filter'); // Log unknown filter type
    }
  }

  // Function to present a toast message
  private async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message, // Set the message for the toast
      duration: 2000 // Set the duration of the toast
    });
    toast.present(); // Display the toast
  }

  
}
