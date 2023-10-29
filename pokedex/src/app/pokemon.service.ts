import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, mergeMap } from 'rxjs';
import { Pokemon } from './types/Pokemon';
import { IPokeData } from './types/IPokeData';
import { IEvolutionChain } from './types/IEvolutionChain';
import { PokeEvolution } from './types/PokeEvolution';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  baseUrl: string = "https://pokeapi.co/api/v2";
  spriteBaseUrl: string = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

  constructor(private http: HttpClient) { }

  getSpriteUrl(no: number): string {
    return `${this.spriteBaseUrl}${no}.png`;
  }

  getAllPokemon(): Observable<string[]> {
    const url: string = `${this.baseUrl}/pokedex/1`;
    return this.http.get(url)
      .pipe(
        map((data: any) => data.pokemon_entries
          .map((entry: any) => entry.pokemon_species.name)
        )
      );
  }

  getAllPokemonNamesAndIds(): Observable<{ name: string; id: number }[]> {
    const url: string = `${this.baseUrl}/pokedex/1`;

    return this.http.get(url).pipe(
      map((data: any) =>
        data.pokemon_entries.map((entry: any) => ({
          name: entry.pokemon_species.name,
          id: entry.entry_number,
        }))
      )
    );
  }

  getPokemonDetailsByName(name: string): Observable<Pokemon> {
    return this.getAllPokemonNamesAndIds().pipe(
      mergeMap((pokemonList) => {
        const foundPokemon = pokemonList.find(
          (pokemon) => pokemon.name.toLowerCase() === name.toLowerCase()
        );

        if (foundPokemon) {
          return this.getPokemonDetails(foundPokemon.id);
        } else {
          return new Observable<Pokemon>((observer) => {
            observer.error('Pokemon not found');
            observer.complete();
          });
        }
      })
    );
  }




  getPokemonDetails(no: number): Observable<Pokemon> {
    const url: string = `${this.baseUrl}/pokemon/${no}`;

    return this.http.get(url)
      .pipe(
        mergeMap((pokeData: any) => {
          return this.http.get(pokeData.species.url)
            .pipe(mergeMap((speciesData: any) => {
              return this.http.get(speciesData.evolution_chain.url)
                .pipe(map((evolutionData: any) => {
                  return {
                    pokeData,
                    evolutionData
                  }
                }))
            }))
        }),
        map(this.refactorPokemonDetails),
      );
  }

  refactorPokemonDetails(data: IPokeData): Pokemon {
    const pokeData = data.pokeData;
    const evolutionData = data.evolutionData;

    return {
      picture: pokeData.sprites.front_default,
      name: pokeData.name,
      abilities: pokeData.abilities.map((ability: any) => ability.ability.name),
      types: pokeData.types.map((type: any) => type.type.name),
      orderNumber: pokeData.id,
      stats: pokeData.stats.map((stat: any) => {
        return {
          name: stat.stat.name,
          value: stat.base_stat
        }
      }),
      possibleEvolutions: PokemonService.collectEvolutionChain(evolutionData.chain),
      moves: pokeData.moves.map((move: any) => move.move.name)
    }
  }

  static collectEvolutionChain(data: IEvolutionChain): PokeEvolution[] {
    let evolution: PokeEvolution[] = [];
    PokemonService.collectEvolutions(evolution, data);
    return evolution;
  }

  static collectEvolutions(collect: PokeEvolution[], evolution: IEvolutionChain) {
    let pokeEvolution: PokeEvolution = { name: "", id: "" };

    pokeEvolution.name = evolution.species.name;

    const speciesUrl = evolution.species.url;
    pokeEvolution.id = speciesUrl
      .substring("https://pokeapi.co/api/v2/pokemon-species/".length, speciesUrl.length - 1);

    collect.push(pokeEvolution);

    if (evolution.evolves_to.length) {
      evolution.evolves_to.forEach((nextEvolution: any) =>
        PokemonService.collectEvolutions(collect, nextEvolution))
    }
  }
}