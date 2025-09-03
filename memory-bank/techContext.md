# Tech Context - MRD Hábitos

## Stack Tecnológico

### Frontend Core
- **Next.js 15.5.2**: Framework React com App Router
- **React 19.1.0**: Biblioteca de interface com hooks modernos
- **TypeScript 5**: Tipagem estática para JavaScript
- **Turbopack**: Bundler rápido para desenvolvimento

### Styling & UI
- **Tailwind CSS 4.1.12**: Framework CSS utilitário
- **Shadcn/ui**: Biblioteca de componentes baseada em Radix UI
- **Radix UI**: Componentes primitivos acessíveis
- **Lucide React**: Ícones SVG otimizados
- **Geist Fonts**: Tipografia moderna (Sans + Mono)

### Visualização de Dados
- **Recharts 3.1.2**: Biblioteca de gráficos para React
- **ResponsiveContainer**: Componentes responsivos para charts

### Desenvolvimento
- **ESLint 9**: Linting de código
- **PostCSS**: Processamento de CSS
- **tw-animate-css**: Animações para Tailwind

### Deploy & Analytics
- **Vercel**: Plataforma de deploy e hosting
- **Vercel Analytics**: Métricas de uso da aplicação

## Configurações Importantes

### Next.js Config
```javascript
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true }
}
```

### TypeScript Config
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": { "@/*": ["./*"] }
  }
}
```

### Tailwind CSS v4
- **Configuração inline**: Usando `@theme` no CSS
- **Variáveis CSS**: Sistema de cores customizado
- **Modo único**: Apenas tema claro (branco)
- **Animações**: Transições suaves e hover effects

## Arquitetura de Dados

### Armazenamento Local
```typescript
// Chaves do localStorage
"mrd-current-user"        // Usuário logado
"minimo-ridiculo-habits"  // Array de hábitos
"mrd-users"              // Array de usuários cadastrados
```

### Estruturas de Dados
```typescript
interface Habit {
  id: string                    // ID único (timestamp)
  name: string                  // Nome do hábito
  completions: Record<string, boolean> // data -> status
}

interface User {
  name: string                  // Nome do usuário
  password: string             // Senha (sem hash)
}
```

## Padrões de Desenvolvimento

### 1. Componentes
- **Client Components**: Todos os componentes são "use client"
- **Props Interface**: Tipagem explícita para todas as props
- **Estado Local**: useState para gerenciamento de estado
- **Efeitos**: useEffect para side effects

### 2. Styling
```css
/* Padrão de classes utilitárias */
.floating-card {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.habit-day {
  transition: all 0.2s ease-in-out;
}
```

### 3. Responsividade
- **Mobile-first**: Design baseado em mobile
- **Breakpoints**: sm, md, lg para diferentes telas
- **Flexbox/Grid**: Layout responsivo moderno
- **Touch-friendly**: Botões com tamanho mínimo de 44px

## Performance

### Otimizações Implementadas
- **Turbopack**: Build mais rápido em desenvolvimento
- **Image Optimization**: Desabilitada para simplicidade
- **Bundle Size**: Dependências mínimas e otimizadas
- **Lazy Loading**: Componentes carregados sob demanda

### Métricas de Performance
- **First Contentful Paint**: Otimizado com fontes e CSS
- **Largest Contentful Paint**: Componentes leves
- **Cumulative Layout Shift**: Layout estável
- **First Input Delay**: Interações responsivas

## Segurança

### Autenticação
- **Local Storage**: Dados armazenados localmente
- **Sem Hash**: Senhas em texto plano (limitação atual)
- **Sessão Persistente**: Login mantido entre sessões
- **Validação**: Validação básica de formulários

### Dados
- **Client-side**: Todos os dados no navegador
- **Sem API**: Sem comunicação com servidor
- **Isolamento**: Dados por usuário separados
- **Backup**: Depende do localStorage do navegador

## Limitações Técnicas

### 1. Armazenamento
- **localStorage**: Limitado a ~5-10MB
- **Sem Sincronização**: Dados apenas no dispositivo
- **Sem Backup**: Perda de dados se limpar navegador

### 2. Autenticação
- **Sem Hash**: Senhas não criptografadas
- **Sem Recuperação**: Não há reset de senha
- **Local**: Apenas no dispositivo atual

### 3. Escalabilidade
- **Single User**: Um usuário por dispositivo
- **Sem API**: Não há backend para múltiplos usuários
- **Performance**: Limitado pelo localStorage

## Roadmap Técnico

### Melhorias Futuras
1. **Backend**: API para sincronização entre dispositivos
2. **Autenticação**: Hash de senhas e recuperação
3. **Backup**: Sincronização em nuvem
4. **PWA**: Funcionalidade offline completa
5. **Notificações**: Lembretes de hábitos
6. **Exportação**: Backup de dados em JSON
