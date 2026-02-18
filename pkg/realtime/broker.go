package realtime

import (
	"sync"
	"time"
)

// Event represents a single server-pushed event.
type Event struct {
	Type          string    `json:"type"`
	Timestamp     time.Time `json:"timestamp"`
	LogID         string    `json:"logId,omitempty"`
	ProviderIDs   []string  `json:"providerIds,omitempty"`
	TransactionID string    `json:"transactionId,omitempty"`
}

// Broker is an in-memory pub/sub broker for realtime events.
type Broker struct {
	mu          sync.RWMutex
	subscribers map[chan Event]struct{}
}

func NewBroker() *Broker {
	return &Broker{
		subscribers: make(map[chan Event]struct{}),
	}
}

func (b *Broker) Subscribe() chan Event {
	ch := make(chan Event, 64)
	b.mu.Lock()
	b.subscribers[ch] = struct{}{}
	b.mu.Unlock()
	return ch
}

func (b *Broker) Unsubscribe(ch chan Event) {
	b.mu.Lock()
	if _, ok := b.subscribers[ch]; ok {
		delete(b.subscribers, ch)
		close(ch)
	}
	b.mu.Unlock()
}

func (b *Broker) Publish(event Event) {
	b.mu.RLock()
	defer b.mu.RUnlock()
	for ch := range b.subscribers {
		select {
		case ch <- event:
		default:
		}
	}
}
