import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MovieService } from 'src/app/services/movie.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-movie-details',
  templateUrl: './movie-details.page.html',
  styleUrls: ['./movie-details.page.scss'],
})
export class MovieDetailsPage implements OnInit {
  // Holds the movie details
  movie: any = null;
  
  // Base URL for images
  imageBaseUrl = environment.images;

  constructor(private route: ActivatedRoute, private movieServices: MovieService) { }

  ngOnInit() {
    // Get movie ID from the route parameters
    const id = this.route.snapshot.paramMap.get('id');

    // If an ID is provided, fetch the movie details
    if (id !== null) {
      this.movieServices.getMovieDetails(id).subscribe((res) => {
        console.log(res);
        this.movie = res;
      });
    } else {
      // If no ID is provided, log an error
      console.error('No ID provided');
    }
  }
  
  // Open movie homepage in a new tab/window
  openHomepage(){
    window.open(this.movie.homepage);
  }

  // Calculate star rating based on the average vote
  getStarRating(vote_average: number) {
    const stars = {
      full: Math.floor(vote_average / 2), // Number of full stars
      half: Math.floor(vote_average) % 2, // Number of half stars
      empty: Math.floor(5 - (Math.floor(vote_average / 2) + Math.floor(vote_average) % 2)), // Number of empty stars
    };
    return stars;
  }
  
}
