We may decide to special case certain patterns to match user
expectations, such as using predicates as the sole argument in
**`delete()`**, rewriting
**`set(a = b)`** as
**`set(a, b)`**, and not requiring
repetition in **`where`** when
filtering collections of primitives (e.g. expanding
**`hobby where ’Dining’`** to
**`hobby where hobby = ’Dining’`**).

We need to significantly improve the syntax for questions like Q9 and
Q13 (filtering on one property and setting another), since our user
study indicated a clear problem with the current syntax. Perhaps
exposing the **`setif()`** etc
functions we have implemented would be sufficient or otherwise modifying
the syntax of **`set()`**.

A different approach would be to also use an function-based syntax as
the value of this attribute, and expose event-related information as
declarative variables . Mavo already does this to a small degree, by
exposing special properties[^2], such as
**`$mouse.x`**,
**`$mouse.y`**,
**`$hash`**,
**`$now`** and others, which
update automatically, even when no data has changed. We could expand
this vocabulary to expose more event information (such as which key is
pressed), which would also be useful for expressions in general. This
approach would also make it possible to use data changes as triggers.
While powerful, this could easily result in cycles, which may confuse
novices.