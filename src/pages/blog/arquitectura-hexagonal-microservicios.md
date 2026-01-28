---
layout: ../../layouts/BlogLayout.astro
title: "Arquitectura Hexagonal: Por qué es la Mejor Opción para Microservicios"
description: "Guía completa sobre cómo implementar arquitectura hexagonal en tus proyectos de microservicios para lograr alta mantenibilidad."
date: "2025-11-10"
category: "Arquitectura"
readTime: "12 min"
author: "Equipo Aquí Creamos"
image: "/img/fondo.png"
---

## Introducción a la Arquitectura Hexagonal

La **Arquitectura Hexagonal**, también conocida como *Ports and Adapters*, es un patrón arquitectónico propuesto por Alistair Cockburn que busca crear aplicaciones que sean independientes de frameworks, bases de datos y otros detalles externos.

### ¿Por qué "Hexagonal"?

El nombre proviene de la representación visual del patrón, donde:
- El **núcleo** (hexágono central) contiene la lógica de negocio
- Los **puertos** son interfaces que definen cómo se comunica el núcleo
- Los **adaptadores** implementan esos puertos para conectar con el mundo exterior

## Principios Fundamentales

### 1. Separación de Responsabilidades

La arquitectura hexagonal separa claramente:

- **Dominio**: Lógica de negocio pura
- **Aplicación**: Casos de uso y orquestación
- **Infraestructura**: Detalles técnicos (BD, APIs, UI)

### 2. Inversión de Dependencias

El flujo de dependencias siempre apunta hacia el interior:

```
Infraestructura → Aplicación → Dominio
```

Esto significa que el dominio **nunca** depende de la infraestructura.

### 3. Testabilidad

Al separar la lógica de negocio de los detalles técnicos, podemos:
- Testear el dominio sin bases de datos
- Mockear adaptadores fácilmente
- Ejecutar tests rápidamente

## Estructura de Capas

### Capa de Dominio

Contiene las **entidades** y **reglas de negocio**:

```typescript
// domain/entities/Order.ts
export class Order {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    private items: OrderItem[],
    private status: OrderStatus
  ) {}

  addItem(item: OrderItem): void {
    if (this.status !== OrderStatus.DRAFT) {
      throw new Error('Cannot modify confirmed order');
    }
    this.items.push(item);
  }

  calculateTotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  confirm(): void {
    if (this.items.length === 0) {
      throw new Error('Cannot confirm empty order');
    }
    this.status = OrderStatus.CONFIRMED;
  }
}
```

### Capa de Aplicación

Define **casos de uso** y **puertos**:

```typescript
// application/ports/OrderRepository.ts
export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
  findByCustomer(customerId: string): Promise<Order[]>;
}

// application/usecases/CreateOrder.ts
export class CreateOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private eventPublisher: EventPublisher
  ) {}

  async execute(command: CreateOrderCommand): Promise<string> {
    const order = new Order(
      generateId(),
      command.customerId,
      [],
      OrderStatus.DRAFT
    );

    command.items.forEach(item => order.addItem(item));
    order.confirm();

    await this.orderRepository.save(order);
    await this.eventPublisher.publish(
      new OrderCreatedEvent(order.id)
    );

    return order.id;
  }
}
```

### Capa de Infraestructura

Implementa los **adaptadores**:

```typescript
// infrastructure/persistence/PostgresOrderRepository.ts
export class PostgresOrderRepository implements OrderRepository {
  constructor(private db: Database) {}

  async save(order: Order): Promise<void> {
    await this.db.query(
      'INSERT INTO orders (id, customer_id, status) VALUES ($1, $2, $3)',
      [order.id, order.customerId, order.status]
    );
  }

  async findById(id: string): Promise<Order | null> {
    const result = await this.db.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );

    if (!result.rows[0]) return null;

    return this.mapToOrder(result.rows[0]);
  }
}

// infrastructure/api/ExpressOrderController.ts
export class ExpressOrderController {
  constructor(private createOrderUseCase: CreateOrderUseCase) {}

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderId = await this.createOrderUseCase.execute({
        customerId: req.body.customerId,
        items: req.body.items
      });

      res.status(201).json({ orderId });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

## Ventajas en Microservicios

### 1. Independencia Tecnológica

Puedes cambiar:
- Base de datos (PostgreSQL → MongoDB)
- Framework web (Express → Fastify)
- Protocolo de comunicación (REST → gRPC)

Sin tocar la lógica de negocio.

### 2. Facilidad de Testing

```typescript
// test/CreateOrder.test.ts
describe('CreateOrderUseCase', () => {
  it('should create order successfully', async () => {
    // Arrange
    const mockRepository = new InMemoryOrderRepository();
    const mockPublisher = new InMemoryEventPublisher();
    const useCase = new CreateOrderUseCase(
      mockRepository,
      mockPublisher
    );

    // Act
    const orderId = await useCase.execute({
      customerId: 'customer-123',
      items: [{ productId: 'prod-1', quantity: 2, price: 100 }]
    });

    // Assert
    expect(orderId).toBeDefined();
    const savedOrder = await mockRepository.findById(orderId);
    expect(savedOrder?.calculateTotal()).toBe(200);
  });
});
```

### 3. Evolución Gradual

Puedes migrar servicios uno por uno sin afectar el resto del sistema.

## Implementación Práctica

### Estructura de Directorios

```
src/
├── domain/
│   ├── entities/
│   │   ├── Order.ts
│   │   └── Customer.ts
│   └── valueObjects/
│       ├── Money.ts
│       └── Email.ts
├── application/
│   ├── ports/
│   │   ├── OrderRepository.ts
│   │   └── EventPublisher.ts
│   └── usecases/
│       ├── CreateOrder.ts
│       └── CancelOrder.ts
└── infrastructure/
    ├── persistence/
    │   └── PostgresOrderRepository.ts
    ├── api/
    │   └── ExpressOrderController.ts
    ├── messaging/
    │   └── RabbitMQEventPublisher.ts
    └── config/
        └── DependencyInjection.ts
```

### Configuración de Dependencias

```typescript
// infrastructure/config/DependencyInjection.ts
export class Container {
  private static instance: Container;

  private orderRepository!: OrderRepository;
  private eventPublisher!: EventPublisher;
  private createOrderUseCase!: CreateOrderUseCase;

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
      Container.instance.configure();
    }
    return Container.instance;
  }

  private configure(): void {
    // Infraestructura
    this.orderRepository = new PostgresOrderRepository(database);
    this.eventPublisher = new RabbitMQEventPublisher(rabbitMQ);

    // Casos de uso
    this.createOrderUseCase = new CreateOrderUseCase(
      this.orderRepository,
      this.eventPublisher
    );
  }

  getCreateOrderUseCase(): CreateOrderUseCase {
    return this.createOrderUseCase;
  }
}
```

## Patrones Complementarios

### Event Sourcing

Combina bien con arquitectura hexagonal:

```typescript
export class EventSourcedOrderRepository implements OrderRepository {
  async save(order: Order): Promise<void> {
    const events = order.getUncommittedEvents();
    await this.eventStore.append(order.id, events);
  }

  async findById(id: string): Promise<Order | null> {
    const events = await this.eventStore.load(id);
    return Order.fromEvents(events);
  }
}
```

### CQRS (Command Query Responsibility Segregation)

Separa operaciones de lectura y escritura:

```typescript
// Write Model
export interface OrderCommandRepository {
  save(order: Order): Promise<void>;
}

// Read Model
export interface OrderQueryRepository {
  findById(id: string): Promise<OrderDTO | null>;
  findByCustomer(customerId: string): Promise<OrderDTO[]>;
}
```

## Errores Comunes a Evitar

### 1. Dominio Anémico

❌ **Mal**:
```typescript
class Order {
  id: string;
  total: number;
  status: string;
}
```

✅ **Bien**:
```typescript
class Order {
  confirm(): void { /* lógica */ }
  cancel(): void { /* lógica */ }
  calculateTotal(): number { /* lógica */ }
}
```

### 2. Dependencias Incorrectas

❌ **Mal**: Dominio depende de infraestructura
```typescript
// domain/Order.ts
import { Database } from '../infrastructure/Database';
```

✅ **Bien**: Infraestructura depende de dominio
```typescript
// infrastructure/PostgresOrderRepository.ts
import { Order } from '../domain/Order';
```

### 3. Lógica de Negocio en Controladores

❌ **Mal**:
```typescript
async createOrder(req, res) {
  const order = { ...req.body };
  // validaciones y lógica aquí
  await db.save(order);
}
```

✅ **Bien**:
```typescript
async createOrder(req, res) {
  const orderId = await this.createOrderUseCase.execute(req.body);
  res.json({ orderId });
}
```

## Conclusión

La **Arquitectura Hexagonal** es ideal para microservicios porque:

✅ Facilita el testing y mantenimiento
✅ Permite evolucionar tecnologías sin reescribir lógica
✅ Clarifica responsabilidades y límites
✅ Mejora la colaboración entre equipos

¿Quieres implementar arquitectura hexagonal en tu proyecto? [Agenda una consultoría gratuita](/#asesorias) con nuestro equipo.

---

**Referencias:**
- [Hexagonal Architecture by Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- Clean Architecture - Robert C. Martin
- Domain-Driven Design - Eric Evans
