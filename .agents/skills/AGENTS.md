# AGENTS.md

## Purpose

This file defines the Angular development conventions for this repository.

All generated or modified Angular code must follow these rules unless the user explicitly requests an exception.

---

## Technology Stack

Use the following technologies where appropriate:

- Angular with standalone components
- TypeScript
- Angular Signals
- RxJS and Observables
- NgRx Signal Store
- NgRx Signal Store `withEntities`
- Angular Signal Forms
- Angular Material
- Tailwind CSS
- AG Grid
- Angular Router

Prefer modern Angular APIs. Do not generate legacy Angular patterns when a modern alternative exists.

---

## Project Structure

Organize the Angular application by shared functionality and business features.

```text
src/
└── app/
    ├── shared/
    │   ├── models/
    │   │   └── todo.ts
    │   ├── services/
    │   │   └── todo.service.ts
    │   ├── stores/
    │   │   └── todo.store.ts
    │   └── ui/
    │       └── custom-table.ts
    │
    ├── features/
    │   ├── home/
    │   │   ├── components/
    │   │   │   └── todo-list.ts
    │   │   └── pages/
    │   │       └── home.ts
    │   │
    │   └── settings/
    │       ├── components/
    │       │   └── settings-tabs.ts
    │       └── pages/
    │           └── settings.ts
    │
    ├── app.routes.ts
    └── app.ts
```

### Folder responsibilities

- `shared/models`: Shared interfaces, types, API models, and domain models.
- `shared/services`: Services responsible for HTTP requests and external integrations.
- `shared/stores`: NgRx Signal Stores responsible for feature or application state.
- `shared/ui`: Reusable presentational components that are not specific to one feature.
- `features/<feature>/components`: Dumb/presentational components belonging to one feature.
- `features/<feature>/pages`: Smart/container components used as routed pages.

Do not place feature-specific code in `shared`.

Use lowercase kebab-case file names.

Examples:

```text
todo-list.ts
settings-tabs.ts
todo.service.ts
todo.store.ts
```

---

## Smart and Dumb Components

Use a strict smart/dumb component separation.

### Smart components

Smart components:

- Are usually located under `features/<feature>/pages`.
- Are responsible for orchestration and application logic.
- May inject stores, services, the router, route information, or other dependencies.
- Read state from Signal Stores.
- Trigger store actions.
- Pass data to dumb components.
- Handle events emitted by dumb components.
- May coordinate routing, forms, API operations, and feature state.

Example:

```ts
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TodoListComponent],
  styles: `
    :host {
      display: block;
    }
  `,
  template: `
    <app-todo-list
      [todos]="todoStore.entities()"
      (todoCreated)="createTodo($event)"
      (todoDeleted)="deleteTodo($event)"
    />
  `,
})
export default class HomeComponent {
  protected readonly todoStore = inject(TodoStore);

  protected createTodo(title: string): void {
    this.todoStore.createTodo(title);
  }

  protected deleteTodo(todoId: string): void {
    this.todoStore.deleteTodo(todoId);
  }
}
```

### Dumb components

Dumb components:

- Are usually located under `features/<feature>/components` or `shared/ui`.
- Only display data and emit user interactions.
- Must not inject application services or stores.
- Must not make API calls.
- Must not contain business logic.
- May contain simple UI-only logic.
- Receive data through signal inputs.
- Emit events through modern output APIs.

Example:

```ts
@Component({
  selector: 'app-todo-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  styles: `
    :host {
      display: block;
    }
  `,
  template: `
    @for (todo of todos(); track todo.id) {
      <div class="flex items-center justify-between gap-4">
        <span>{{ todo.title }}</span>

        <button
          mat-button
          type="button"
          (click)="todoDeleted.emit(todo.id)"
        >
          Delete
        </button>
      </div>
    }
  `,
})
export default class TodoListComponent {
  readonly todos = input.required<readonly Todo[]>();
  readonly todoDeleted = output<string>();
  readonly todoCreated = output<string>();
}
```

Do not use `@Input()` or `@Output()` decorators.

Use:

```ts
input()
input.required()
output()
model()
```

when appropriate.

---

## Component Definition Order

Define component metadata in this order:

1. `selector`
2. `changeDetection`
3. `imports`
4. `styles`
5. `template`

Then define the component class.

Example:

```ts
@Component({
  selector: 'app-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  styles: `
    :host {
      display: block;
    }
  `,
  template: `
    <p>Example</p>
  `,
})
export default class ExampleComponent {}
```

Every component must use:

```ts
changeDetection: ChangeDetectionStrategy.OnPush
```

---

## Single-File Components

Keep the following in the same `.ts` file:

- Component class
- HTML template
- Component styles

Do not create separate `.html`, `.css`, or `.scss` files for components unless the user explicitly asks for them.

Use inline template and inline styles:

```ts
@Component({
  selector: 'app-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  styles: `
    :host {
      display: block;
    }
  `,
  template: `
    <p>Example</p>
  `,
})
export default class ExampleComponent {}
```

---

## Class Exports

Use default exports for Angular components.

Smart component:

```ts
export default class HomeComponent {}
```

Dumb component:

```ts
export default class TodoListComponent {}
```

Import default-exported components without braces:

```ts
import TodoListComponent from '../components/todo-list';
```

Services, stores, guards, interfaces, types, and utility functions should normally use named exports.

---

## Dependency Injection

Use the `inject()` function.

Do not use constructor injection.

Correct:

```ts
export class TodoService {
  private readonly http = inject(HttpClient);
}
```

Incorrect:

```ts
export class TodoService {
  constructor(private readonly http: HttpClient) {}
}
```

Use `private readonly` for injected implementation dependencies unless the template needs access to them.

Use `protected readonly` for state or members accessed by a component template.

---

## Declarative Programming

Prefer declarative code over imperative code.

Use:

- Signals for synchronous state.
- `computed()` for derived state.
- RxJS operators for asynchronous workflows.
- Angular template control-flow syntax.
- Immutable transformations.
- Store methods for state transitions.

Avoid:

- Manually synchronizing duplicated state.
- Deeply nested subscriptions.
- Calling `subscribe()` inside components without a strong reason.
- Mutating arrays or objects in place.
- Large imperative event handlers.
- Business logic inside templates.

Prefer:

```ts
readonly completedTodos = computed(() =>
  this.todoStore.entities().filter(todo => todo.completed),
);
```

Instead of maintaining a second mutable list of completed todos.

Use modern template control flow:

```html
@if (isLoading()) {
  <mat-spinner />
} @else {
  @for (todo of todos(); track todo.id) {
    <app-todo-item [todo]="todo" />
  } @empty {
    <p>No todos found.</p>
  }
}
```

Do not generate legacy `*ngIf`, `*ngFor`, or `ng-template` patterns unless required by a library.

---

## Signals and Observables

Use Signals for application and UI state.

Examples:

```ts
readonly selectedTodoId = signal<string | null>(null);

readonly selectedTodo = computed(() => {
  const selectedId = this.selectedTodoId();

  return this.todoStore
    .entities()
    .find(todo => todo.id === selectedId) ?? null;
});
```

Use Observables for asynchronous activities such as:

- HTTP requests
- Router events
- WebSocket streams
- Debounced searches
- Time-based operations
- Combining asynchronous sources

Use RxJS operators instead of nested subscriptions.

Example:

```ts
searchTodos(query: string): Observable<readonly Todo[]> {
  return this.http
    .get<readonly Todo[]>('/api/todos', {
      params: { query },
    })
    .pipe(
      map(todos => todos.filter(todo => !todo.archived)),
      catchError(error => {
        console.error('Could not load todos', error);
        return of([]);
      }),
    );
}
```

When bridging RxJS and Signals, use Angular interoperability utilities such as:

```ts
toSignal()
toObservable()
takeUntilDestroyed()
```

Do not manually manage subscriptions when `takeUntilDestroyed()` or a declarative alternative can be used.

---

## Services

Services are responsible for external communication and infrastructure concerns.

Examples:

- HTTP API calls
- Browser storage
- Authentication providers
- WebSocket connections
- Third-party integrations

A service should return Observables for asynchronous operations.

Example:

```ts
@Injectable({
  providedIn: 'root',
})
export class TodoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/todos';

  getTodos(): Observable<readonly Todo[]> {
    return this.http.get<readonly Todo[]>(this.baseUrl);
  }

  createTodo(request: CreateTodoRequest): Observable<Todo> {
    return this.http.post<Todo>(this.baseUrl, request);
  }

  deleteTodo(todoId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${todoId}`);
  }
}
```

Services should not own component UI state.

---

## State Management

Use NgRx Signal Store for shared, feature-level, or complex state.

Use `withEntities` for collections with stable identifiers.

Store responsibilities include:

- Holding state.
- Exposing computed state.
- Calling services through store methods.
- Updating loading and error state.
- Adding, updating, or removing entities.
- Coordinating state transitions.

Services perform the raw API requests. Stores expose application-oriented methods such as:

```ts
fetchTodos()
createTodo()
updateTodo()
deleteTodo()
```

Example structure:

```ts
import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  addEntity,
  removeEntity,
  setAllEntities,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  catchError,
  EMPTY,
  exhaustMap,
  pipe,
  switchMap,
  tap,
} from 'rxjs';

interface TodoStoreState {
  isLoading: boolean;
  error: string | null;
}

const initialState: TodoStoreState = {
  isLoading: false,
  error: null,
};

export const TodoStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),
  withEntities<Todo>(),

  withComputed(store => ({
    completedTodos: computed(() =>
      store.entities().filter(todo => todo.completed),
    ),
  })),

  withMethods((
    store,
    todoService = inject(TodoService),
  ) => ({
    fetchTodos: rxMethod<void>(
      pipe(
        tap(() => {
          patchState(store, {
            isLoading: true,
            error: null,
          });
        }),
        switchMap(() =>
          todoService.getTodos().pipe(
            tap(todos => {
              patchState(
                store,
                setAllEntities(todos),
                {
                  isLoading: false,
                },
              );
            }),
            catchError(() => {
              patchState(store, {
                isLoading: false,
                error: 'Todos could not be loaded.',
              });

              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    createTodo: rxMethod<CreateTodoRequest>(
      pipe(
        exhaustMap(request =>
          todoService.createTodo(request).pipe(
            tap(todo => patchState(store, addEntity(todo))),
            catchError(() => {
              patchState(store, {
                error: 'Todo could not be created.',
              });

              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    deleteTodo: rxMethod<string>(
      pipe(
        exhaustMap(todoId =>
          todoService.deleteTodo(todoId).pipe(
            tap(() => patchState(store, removeEntity(todoId))),
            catchError(() => {
              patchState(store, {
                error: 'Todo could not be deleted.',
              });

              return EMPTY;
            }),
          ),
        ),
      ),
    ),
  })),
);
```

Choose RxJS flattening operators according to behavior:

- `switchMap`: cancel the previous request when a newer one starts.
- `exhaustMap`: ignore repeated triggers until the current operation finishes.
- `concatMap`: queue operations and preserve their order.
- `mergeMap`: run operations concurrently.

Do not put raw `HttpClient` calls directly inside components.

---

## Models and Types

Use TypeScript interfaces and type aliases.

Use interfaces primarily for object shapes:

```ts
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
}
```

Use type aliases for unions, mapped types, utility compositions, and constrained values:

```ts
export type TodoStatus = 'open' | 'completed' | 'archived';

export type CreateTodoRequest = Pick<Todo, 'title'>;
```

Prefer `readonly` properties and immutable collections where mutation is not intended:

```ts
export interface TodoListViewModel {
  readonly todos: readonly Todo[];
  readonly isLoading: boolean;
}
```

Do not use `any`.

Use `unknown` when a value is genuinely unknown and narrow it safely.

---

## Routing

Define routes in `app.routes.ts`.

Use lazy-loaded standalone components.

Because components use default exports, resolve `module.default`:

```ts
import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/home/pages/home').then(module => module.default),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settings/pages/settings').then(
        module => module.default,
      ),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
```

Do not eagerly import routed page components unless there is a specific reason.

Use an authentication guard when authentication exists and a route requires a signed-in user.

Prefer functional guards with `inject()`.

Example:

```ts
export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  return authStore.isAuthenticated()
    ? true
    : router.createUrlTree(['/login']);
};
```

---

## Root Component

Use `RouterOutlet` in the root component.

Example:

```ts
import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  styles: `
    :host {
      display: block;
      min-height: 100%;
    }
  `,
  template: `<router-outlet />`,
})
export default class AppComponent {}
```

---

## Forms

Use Angular Signal Forms.

Do not create new template-driven forms.

Avoid legacy reactive forms unless a required library does not support Signal Forms or the user explicitly requests them.

Keep form state in the smart component or a dedicated store.

Pass display values and UI events to dumb form components through `input()`, `output()`, or `model()`.

Form-related business logic and API submission belong in the smart component or store, not in the dumb component.

---

## Styling

Use Tailwind CSS for layout and common visual styling.

Use Angular Material for accessible, behavior-rich UI components such as:

- Dialogs
- Menus
- Buttons
- Inputs
- Selects
- Date pickers
- Tooltips
- Snack bars
- Progress indicators

Use AG Grid for complex data grids.

Prefer Tailwind classes in templates for ordinary styling.

Use the component `styles` property for:

- `:host` styles
- Library overrides
- Complex selectors
- Styles that cannot be expressed cleanly with Tailwind

Avoid unnecessary global CSS.

Do not recreate an Angular Material component from scratch when Angular Material already provides the needed behavior.

---

## Imports

Use standalone component imports.

Import only what a component uses.

Prefer direct imports instead of large shared Angular modules.

Correct:

```ts
imports: [
  MatButtonModule,
  MatIconModule,
  TodoListComponent,
]
```

Avoid creating a general `SharedModule`.

Keep imports organized and remove unused imports.

---

## Naming Conventions

Use descriptive names.

### Components

```text
HomeComponent
TodoListComponent
SettingsTabsComponent
```

### Services

```text
TodoService
AuthService
WorkspaceService
```

### Stores

```text
TodoStore
AuthStore
WorkspaceStore
```

### Signals

Use names that describe the value:

```ts
readonly selectedTodoId = signal<string | null>(null);
readonly isDialogOpen = signal(false);
```

Do not add `Signal` to every signal name.

### Observables

Use the `$` suffix for exposed Observable values:

```ts
readonly searchResults$: Observable<readonly Todo[]>;
```

Do not use the `$` suffix for Signals.

### Event outputs

Name outputs after events, not commands:

```ts
readonly todoSelected = output<string>();
readonly todoDeleted = output<string>();
readonly dialogClosed = output<void>();
```

Avoid:

```ts
readonly deleteTodo = output<string>();
```

---

## Access Modifiers

Use explicit access modifiers where useful.

For component members:

- `protected` for members used by the template.
- `private` for internal implementation details.
- `readonly` wherever reassignment is not required.
- Public members only when they are intentionally part of an external API.

Example:

```ts
export default class HomeComponent {
  protected readonly todoStore = inject(TodoStore);
  private readonly router = inject(Router);
}
```

---

## Error Handling

Handle API errors in the store or service layer.

Store user-readable error state when the UI must display an error.

Do not silently swallow errors.

Do not expose raw backend error objects directly in templates.

Example:

```ts
interface TodoStoreState {
  readonly error: string | null;
}
```

Dumb components may display an error passed through an input, but they must not decide how infrastructure errors are interpreted.

---

## Testing Expectations

When adding tests:

- Test smart components for orchestration and interaction with stores.
- Test dumb components through inputs, rendered output, and emitted events.
- Test services for request URL, HTTP method, payload, and response mapping.
- Test stores for state transitions, entity updates, loading state, and failures.
- Prefer behavior-oriented tests over implementation-detail tests.

Do not rely on private members in tests.

---

## Code Generation Checklist

Before completing Angular work, verify that:

- The correct `shared` or `features` folder is used.
- Smart and dumb component responsibilities are separated.
- Dumb components contain no service or store injection.
- Components use `input()` and `output()`, not decorators.
- Components use `ChangeDetectionStrategy.OnPush`.
- Components use inline templates and styles.
- Dependencies are injected through `inject()`.
- Signals hold synchronous state.
- RxJS handles asynchronous workflows.
- API calls are implemented in services.
- State and API orchestration are implemented in Signal Stores.
- Entity collections use `withEntities` where suitable.
- Routed pages are lazy loaded.
- Default component exports are loaded through `module.default`.
- Protected routes use an auth guard when authentication exists.
- Signal Forms are used for new forms.
- No `any` type was introduced.
- No unused imports or dead code remain.
- The implementation is declarative and immutable where practical.

---

## Prohibited Patterns

Do not generate these patterns unless explicitly requested:

```ts
@Input()
@Output()
```

```ts
constructor(private service: TodoService) {}
```

```ts
changeDetection: ChangeDetectionStrategy.Default
```

```ts
templateUrl: './example.component.html'
styleUrl: './example.component.scss'
```

```ts
this.todoService.getTodos().subscribe(...)
```

inside a dumb component.

Do not place business logic in dumb components.

Do not inject services or stores into dumb components.

Do not call APIs directly from components.

Do not use `any`.

Do not maintain duplicated derived state when it can be expressed with `computed()`.

Do not use legacy NgModules for new feature code.

Do not use legacy structural directives when modern Angular control flow is available.

---

## Decision Rule

When multiple valid implementations are possible, choose the implementation that best preserves:

1. Smart/dumb separation
2. Declarative data flow
3. Signal-based state
4. RxJS-based asynchronous behavior
5. Store-based orchestration
6. Small, focused components
7. Strong typing
8. Modern Angular APIs
