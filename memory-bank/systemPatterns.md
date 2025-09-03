# System Patterns - MRD Hábitos

## Arquitetura Geral

### Estrutura de Componentes
```
app/
├── layout.tsx          # Layout raiz com providers
├── page.tsx           # Ponto de entrada da aplicação
└── globals.css        # Estilos globais e tema

components/
├── home-page.tsx      # Página principal com lista de hábitos
├── add-habit-page.tsx # Formulário de criação de hábitos
├── habit-detail-page.tsx # Detalhes e métricas de um hábito
├── analysis-page.tsx  # Análise geral de desempenho
├── login-page.tsx     # Autenticação (login/cadastro)
├── icon-selector.tsx  # Seletor de ícones para hábitos
└── ui/               # Componentes base do Shadcn/ui
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── label.tsx
    └── tabs.tsx
```

### Padrões de Estado

#### 1. Estado Global da Aplicação
- **Autenticação**: `isAuthenticated` no componente raiz
- **Hábitos**: Array de hábitos gerenciado no `HomePage`
- **Navegação**: Estado de página atual (`currentPage`)

#### 2. Persistência Local
```typescript
// Padrão de armazenamento
localStorage.setItem("mrd-current-user", userName)
localStorage.setItem("minimo-ridiculo-habits", JSON.stringify(habits))
localStorage.setItem("mrd-users", JSON.stringify(users))
```

#### 3. Estrutura de Dados
```typescript
interface Habit {
  id: string
  name: string
  icon: string
  completions: Record<string, boolean> // date -> completed
}

interface User {
  name: string
  password: string
}
```

## Padrões de Navegação

### Sistema de Páginas
- **Estado centralizado**: `currentPage` no `HomePage`
- **Navegação programática**: `setCurrentPage()` para mudanças
- **Páginas disponíveis**: "home", "add", "detail", "analysis"

### Fluxo de Navegação
```
Login → Home → [Add Habit | Habit Detail | Analysis]
```

## Padrões de UI/UX

### 1. Design System
- **Tema**: Suporte automático a tema claro/escuro com detecção do sistema
- **ThemeProvider**: Gerenciamento dinâmico de tema com listener para mudanças do sistema
- **Componentes**: Shadcn/ui com customizações
- **Responsividade**: Mobile-first com breakpoints
- **Animações**: Transições suaves e hover effects

### 2. Padrões de Interação
- **Cards flutuantes**: `floating-card` class para elevação
- **Progresso circular**: SVG customizado para métricas
- **Indicadores de dia**: Círculos coloridos para status
- **Botões de ação**: Sempre com ícones e texto

### 3. Feedback Visual
```css
.habit-day {
  transition: all 0.2s ease-in-out;
}

.habit-day:hover {
  transform: scale(1.1);
}

.floating-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

## Padrões de Dados

### 1. Gerenciamento de Hábitos
```typescript
// Operações CRUD centralizadas
const saveHabits = (newHabits: Habit[]) => {
  setHabits(newHabits)
  localStorage.setItem("minimo-ridiculo-habits", JSON.stringify(newHabits))
}

const addHabit = (name: string, icon: string = "🎯") => { /* ... */ }
const deleteHabit = (id: string) => { /* ... */ }
const updateHabit = (updatedHabit: Habit) => { /* ... */ }
```

### 2. Cálculo de Métricas
- **Progresso semanal**: Baseado em 7 dias a partir do domingo
- **Streaks**: Contagem consecutiva de dias completados
- **Taxa de sucesso**: Porcentagem de conclusões em período específico

### 3. Manipulação de Datas
```typescript
// Padrão para geração de datas
const getWeekDays = () => {
  const today = new Date()
  const currentDay = today.getDay()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - currentDay)
  // ... gerar 7 dias
}
```

## Padrões de Performance

### 1. Otimizações de Renderização
- **useEffect** para carregamento inicial
- **Estado local** para evitar re-renders desnecessários
- **Memoização** de cálculos pesados

### 2. Gerenciamento de Estado
- **Estado local** para componentes específicos
- **Props drilling** controlado para comunicação
- **localStorage** para persistência sem servidor

## Padrões de Acessibilidade

### 1. Navegação
- **Botões com tamanho mínimo**: 44px para touch
- **Contraste adequado**: Preto sobre branco
- **Foco visível**: Estados de hover e focus

### 2. Semântica
- **HTML semântico**: Uso correto de tags
- **Labels associados**: Inputs com labels apropriados
- **Estrutura lógica**: Navegação intuitiva

## Padrões de Tema

### 1. ThemeProvider
```typescript
// Gerenciamento dinâmico de tema
const [theme, setTheme] = useState<Theme>("system")

// Detecção automática de mudanças no sistema
useEffect(() => {
  if (theme === "system") {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemThemeChange = () => applyTheme("system")
    
    mediaQuery.addEventListener("change", handleSystemThemeChange)
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange)
  }
}, [theme])
```

### 2. Aplicação de Tema
- **Detecção automática**: Escuta mudanças na preferência do sistema
- **Aplicação dinâmica**: Atualiza classes CSS em tempo real
- **Persistência**: Salva preferência no localStorage
- **Fallback**: Sistema como padrão com detecção automática

## Padrões de Manutenibilidade

### 1. Organização de Código
- **Separação de responsabilidades**: Cada componente tem função específica
- **Reutilização**: Componentes UI compartilhados
- **Tipagem**: TypeScript para segurança de tipos

### 2. Configuração
- **Centralização**: Configurações em arquivos específicos
- **Flexibilidade**: Fácil customização de temas e estilos
- **Documentação**: Código auto-documentado com nomes claros
