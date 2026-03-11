---
name: lisp-programming
description: >
  Lisp family programming — Common Lisp, Scheme, Clojure, Emacs Lisp, and Racket.
  Use this skill whenever the user writes Lisp code, works with S-expressions, defines macros,
  uses REPL-driven development, builds DSLs, or does any symbolic computation or metaprogramming
  in a Lisp dialect. Also use when the user mentions homoiconicity, cons cells, car/cdr, defmacro,
  reader macros, condition systems, continuations, or is writing Emacs Lisp config — even if they
  just paste parenthesized code without naming the language.
---

# Lisp Programming Guide

This skill provides guidance on the Lisp family of languages, focusing on S-expressions, meta-programming, and interactive development.

## When to Use
- User writes or debugs Lisp code (`.lisp`, `.cl`, `.scm`, `.rkt`, `.clj`, `.el` files).
- Macro writing, expansion, or debugging.
- REPL-driven interactive development.
- Building domain-specific languages (DSLs).
- Symbolic AI, rule engines, or expert systems.
- Emacs configuration and Emacs Lisp.
- Functional programming patterns (map, reduce, filter, closures, currying).
- Clojure-specific: immutable data, STM, Ring/Compojure web, leiningen/deps.edn.

## Core Concepts

### S-Expressions and Homoiconicity
Everything in Lisp is an S-expression — code and data share the same structure. This is homoiconicity, and it's the reason Lisp macros are uniquely powerful: code that writes code operates on the same data structures the programmer uses.

```lisp
;; Data
'(1 2 3)

;; Code — same structure
(+ 1 2 3)

;; Code that manipulates code — still the same structure
(defmacro when (test &body body)
  `(if ,test (progn ,@body)))
```

### Evaluation Model
Lisp evaluation follows simple rules that compose powerfully:
1. **Atoms** evaluate to themselves (numbers, strings, keywords) or their bound value (symbols).
2. **Lists** evaluate the first element as a function/special form and the rest as arguments.
3. **Quote** (`'`) prevents evaluation — returns the literal structure.
4. **Quasiquote** (`` ` ``) allows selective evaluation with `,` (unquote) and `,@` (splice).

```lisp
;; Normal evaluation
(+ 1 2)           ; => 3

;; Quote prevents evaluation
'(+ 1 2)          ; => (+ 1 2)  — just a list

;; Quasiquote with selective unquote
(let ((x 42))
  `(the answer is ,x))  ; => (THE ANSWER IS 42)
```

### The Macro System
Macros transform code at compile time. They receive unevaluated source code as data, transform it, and return new code to be compiled.

```lisp
;; Simple macro — adds a looping construct
(defmacro until (test &body body)
  `(do () (,test)
     ,@body))

;; Usage (expands to DO loop at compile time)
(let ((i 0))
  (until (= i 5)
    (print i)
    (incf i)))

;; Check expansion
(macroexpand-1 '(until (= i 5) (print i) (incf i)))
;; => (DO () ((= I 5)) (PRINT I) (INCF I))
```

**Macro hygiene guidelines:**
- Use `gensym` (CL) or `syntax-rules` (Scheme) to avoid variable capture.
- Keep macros thin — do heavy lifting in helper functions.
- Always test with `macroexpand-1` before trusting complex macros.

### Condition System (Common Lisp)
CL's condition system is more powerful than try/catch because it separates signaling, handling, and recovery into independent layers.

```lisp
;; Define a condition
(define-condition file-not-found (error)
  ((path :initarg :path :reader file-path)))

;; Signal it
(defun read-config (path)
  (unless (probe-file path)
    (error 'file-not-found :path path))
  (uiop:read-file-string path))

;; Handle with restarts
(defun load-config ()
  (restart-case (read-config "config.lisp")
    (use-default ()
      :report "Use default configuration"
      '((port . 8080) (host . "localhost")))
    (specify-path (new-path)
      :report "Specify a different config path"
      :interactive (lambda () (list (read-line)))
      (read-config new-path))))
```

## Instructions

### REPL-Driven Development
Lisp development centers on the REPL. The workflow is fundamentally interactive — write a function, test it immediately, refine, repeat.

```lisp
;; 1. Define a function
(defun fibonacci (n)
  (if (<= n 1) n
      (+ (fibonacci (- n 1))
         (fibonacci (- n 2)))))

;; 2. Test immediately
(fibonacci 10)  ; => 55

;; 3. Optimize
(defun fibonacci-fast (n)
  (labels ((fib (a b count)
             (if (zerop count) a
                 (fib b (+ a b) (1- count))))))
    (fib 0 1 n))

;; 4. Verify
(fibonacci-fast 50)  ; => 12586269025 (instant)
```

### Common Lisp Essentials
**Data structures:**
```lisp
;; Lists
(cons 1 (cons 2 nil))        ; => (1 2)
(car '(1 2 3))               ; => 1
(cdr '(1 2 3))               ; => (2 3)

;; Hash tables
(let ((ht (make-hash-table :test 'equal)))
  (setf (gethash "name" ht) "Oleg")
  (gethash "name" ht))       ; => "Oleg", T

;; Structs
(defstruct point x y z)
(make-point :x 1 :y 2 :z 3)

;; CLOS objects
(defclass server ()
  ((host :initarg :host :accessor server-host)
   (port :initarg :port :accessor server-port :initform 8080)))
```

### Clojure Specifics
Clojure runs on the JVM with persistent immutable data structures and a strong concurrency model.

```clojure
;; Immutable data
(def config {:host "localhost" :port 8080})
(assoc config :port 3000)  ; => {:host "localhost" :port 3000}
;; config is unchanged

;; Threading macros for readability
(->> (range 100)
     (filter even?)
     (map #(* % %))
     (reduce +))  ; => 161700

;; Atoms for mutable state
(def counter (atom 0))
(swap! counter inc)  ; => 1

;; Destructuring
(let [{:keys [host port]} config]
  (println (str host ":" port)))
```

### Scheme / Racket Specifics
```scheme
;; Tail-recursive factorial
(define (factorial n)
  (let loop ((i n) (acc 1))
    (if (zero? i) acc
        (loop (sub1 i) (* acc i)))))

;; Continuations (call/cc)
(call-with-current-continuation
  (lambda (exit)
    (for-each (lambda (x)
                (when (negative? x) (exit x)))
              '(1 2 -3 4))
    'all-positive))  ; => -3

;; Hygienic macros
(define-syntax-rule (swap! a b)
  (let ([tmp a]) (set! a b) (set! b tmp)))
```

## Constraints
- **NEVER** write deeply nested code without extracting helper functions — Lisp's power is composability, not one giant expression.
- **NEVER** use `eval` at runtime unless building a genuine interpreter — it defeats compilation and creates security holes.
- **NEVER** mutate data in Clojure — use atoms/refs/agents for state, persistent data structures for everything else.
- **ALWAYS** use `gensym` in Common Lisp macros to prevent variable capture.
- **ALWAYS** test macros with `macroexpand-1` before using them in production.
- **ALWAYS** prefer tail recursion and `loop`/`recur` (Clojure) over stack-consuming recursion.
- **ALWAYS** use the REPL to verify behavior incrementally — don't write large blocks untested.

## References
- Common Lisp HyperSpec: [http://www.lispworks.com/documentation/HyperSpec/Front/](http://www.lispworks.com/documentation/HyperSpec/Front/)
- Practical Common Lisp: [https://gigamonkeys.com/book/](https://gigamonkeys.com/book/)
- Structure and Interpretation of Computer Programs: [https://mitpress.mit.edu/sites/default/files/sicp/full-text/book/book.html](https://mitpress.mit.edu/sites/default/files/sicp/full-text/book/book.html)
- Clojure Documentation: [https://clojure.org/reference/documentation](https://clojure.org/reference/documentation)
- Racket Documentation: [https://docs.racket-lang.org/](https://docs.racket-lang.org/)
- On Lisp (Paul Graham): [http://www.paulgraham.com/onlisp.html](http://www.paulgraham.com/onlisp.html)
- Let Over Lambda: [https://letoverlambda.com/](https://letoverlambda.com/)
