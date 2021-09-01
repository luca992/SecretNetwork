use serde::{Deserialize, Serialize};

/// A full [*Cosmos SDK* event].
///
/// This version uses string attributes (similar to [*Cosmos SDK* StringEvent]),
/// which then get magically converted to bytes for Tendermint somewhere between
/// the Rust-Go interface, JSON deserialization and the `NewEvent` call in Cosmos SDK.
///
/// [*Cosmos SDK* event]: https://docs.cosmos.network/v0.42/core/events.html
/// [*Cosmos SDK* StringEvent]: https://github.com/cosmos/cosmos-sdk/blob/v0.42.5/proto/cosmos/base/abci/v1beta1/abci.proto#L56-L70
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[non_exhaustive]
pub struct Event {
    /// The event type. This is renamed to "ty" because "type" is reserved in Rust. This sucks, we know.
    #[serde(rename = "type")]
    pub ty: String,
    /// The attributes to be included in the event.
    ///
    /// You can learn more about these from [*Cosmos SDK* docs].
    ///
    /// [*Cosmos SDK* docs]: https://docs.cosmos.network/v0.42/core/events.html
    pub attributes: Vec<Attribute>,
}

impl Event {
    /// Create a new event with the given type and an empty list of attributes.
    pub fn new(ty: impl Into<String>) -> Self {
        Event {
            ty: ty.into(),
            attributes: Vec::with_capacity(10),
        }
    }

    /// Add an attribute to the event.
    pub fn add_attribute(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.attributes.push(Attribute {
            key: key.into(),
            value: value.into(),
            encrypted: true,
        });
        self
    }

    /// Add a plaintext attribute to the event.
    pub fn add_attribute_plaintext(
        mut self,
        key: impl Into<String>,
        value: impl Into<String>,
    ) -> Self {
        self.attributes.push(Attribute {
            key: key.into(),
            value: value.into(),
            encrypted: false,
        });
        self
    }

    /// Bulk add attributes to the event.
    ///
    /// Anything that can be turned into an iterator and yields something
    /// that can be converted into an `Attribute` is accepted.
    pub fn add_attributes<A: Into<Attribute>>(
        mut self,
        attrs: impl IntoIterator<Item = A>,
    ) -> Self {
        self.attributes.extend(attrs.into_iter().map(A::into));
        self
    }
}

/// Return true
///
/// Only used for serde annotations
fn bool_true() -> bool {
    true
}

/// An key value pair that is used in the context of event attributes in logs
#[derive(Serialize, Deserialize, Clone, Default, Debug, PartialEq)]
pub struct Attribute {
    pub key: String,
    pub value: String,
    /// nonstandard late addition, thus optional and only used in deserialization.
    /// The contracts may return this in newer versions that support distinguishing
    /// encrypted and plaintext logs. We naturally default to encrypted logs, and
    /// don't serialize the field later so it doesn't leak up to the Go layers.
    #[serde(default = "bool_true")]
    #[serde(skip_serializing)]
    pub encrypted: bool,
}

impl Attribute {
    /// Creates a new Attribute. `attr` is just an alias for this.
    pub fn new(key: impl Into<String>, value: impl Into<String>) -> Self {
        let key = key.into();

        #[cfg(debug_assertions)]
        if key.starts_with('_') {
            panic!(
                "attribute key `{}` is invalid - keys starting with an underscore are reserved",
                key
            );
        }

        Self {
            key,
            value: value.into(),
            encrypted: true,
        }
    }

    /// Creates a new Attribute. `attr` is just an alias for this.
    pub fn new_plaintext(key: impl Into<String>, value: impl Into<String>) -> Self {
        let key = key.into();

        #[cfg(debug_assertions)]
        if key.starts_with('_') {
            panic!(
                "attribute key `{}` is invalid - keys starting with an underscore are reserved",
                key
            );
        }

        Self {
            key,
            value: value.into(),
            encrypted: false,
        }
    }
}

impl<K: Into<String>, V: Into<String>> From<(K, V)> for Attribute {
    fn from((k, v): (K, V)) -> Self {
        Attribute::new(k, v)
    }
}

impl<K: AsRef<str>, V: AsRef<str>> PartialEq<(K, V)> for Attribute {
    fn eq(&self, (k, v): &(K, V)) -> bool {
        (self.key.as_str(), self.value.as_str()) == (k.as_ref(), v.as_ref())
    }
}

impl<K: AsRef<str>, V: AsRef<str>> PartialEq<Attribute> for (K, V) {
    fn eq(&self, attr: &Attribute) -> bool {
        attr == self
    }
}

impl<K: AsRef<str>, V: AsRef<str>> PartialEq<(K, V)> for &Attribute {
    fn eq(&self, (k, v): &(K, V)) -> bool {
        (self.key.as_str(), self.value.as_str()) == (k.as_ref(), v.as_ref())
    }
}

impl<K: AsRef<str>, V: AsRef<str>> PartialEq<&Attribute> for (K, V) {
    fn eq(&self, attr: &&Attribute) -> bool {
        attr == self
    }
}

impl PartialEq<Attribute> for &Attribute {
    fn eq(&self, rhs: &Attribute) -> bool {
        *self == rhs
    }
}

impl PartialEq<&Attribute> for Attribute {
    fn eq(&self, rhs: &&Attribute) -> bool {
        self == *rhs
    }
}

/// Creates a new Attribute. `Attribute::new` is an alias for this.
#[inline]
pub fn attr(key: impl Into<String>, value: impl Into<String>) -> Attribute {
    Attribute::new(key, value)
}

/// Creates a new Attribute. `Attribute::new` is an alias for this.
#[inline]
pub fn attr_plaintext(key: impl Into<String>, value: impl Into<String>) -> Attribute {
    Attribute::new_plaintext(key, value)
}