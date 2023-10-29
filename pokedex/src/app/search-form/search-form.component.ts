import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Pokemon } from '../types/Pokemon';
import { PokemonService } from '../pokemon.service';


@Component({
  selector: 'app-search-form',
  templateUrl: './search-form.component.html',
  styleUrls: ['./search-form.component.scss']
})
export class SearchFormComponent {
  searchForm: FormGroup;
  pokemon: Pokemon | null = null;
  errorMessage: string | null = null;

  constructor(private formBuilder: FormBuilder, public pokemonService: PokemonService) {
    this.searchForm = this.formBuilder.group({
      searchQuery: [''] 
    });
  }

  searchPokemon() {
    this.errorMessage = null;
    const searchQuery = this.searchForm.get('searchQuery')?.value;

    if (searchQuery) {
      this.pokemonService.getPokemonDetailsByName(searchQuery)
        .subscribe(
          (pokemon: Pokemon) => {
            this.pokemon = pokemon;
          },
          (error: any) => {
            this.errorMessage = 'Pokemon not found';
            this.pokemon = null;
          }
        );
    }
  }
}