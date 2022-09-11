// Code generated by protoc-gen-gogo. DO NOT EDIT.
// source: secret/usc/v1beta1/usc.proto

package types

import (
	fmt "fmt"
	types "github.com/cosmos/cosmos-sdk/types"
	_ "github.com/gogo/protobuf/gogoproto"
	proto "github.com/gogo/protobuf/proto"
	github_com_gogo_protobuf_types "github.com/gogo/protobuf/types"
	_ "google.golang.org/protobuf/types/known/durationpb"
	_ "google.golang.org/protobuf/types/known/timestamppb"
	io "io"
	math "math"
	math_bits "math/bits"
	time "time"
)

// Reference imports to suppress errors if they are not otherwise used.
var _ = proto.Marshal
var _ = fmt.Errorf
var _ = math.Inf
var _ = time.Kitchen

// This is a compile-time assertion to ensure that this generated file
// is compatible with the proto package it is being compiled against.
// A compilation error at this line likely means your copy of the
// proto package needs to be updated.
const _ = proto.GoGoProtoPackageIsVersion3 // please upgrade the proto package

// Params defines the parameters for the x/usc module.
type Params struct {
	// redeem_duration defines USC -> collateral redeem duration (how long does it takes to convert).
	RedeemDur time.Duration `protobuf:"bytes,1,opt,name=redeem_dur,json=redeemDur,proto3,stdduration" json:"redeem_dur" yaml:"redeem_duration"`
	// max_redeem_entries is a max number of concurrent redeem operations per account.
	MaxRedeemEntries uint32 `protobuf:"varint,2,opt,name=max_redeem_entries,json=maxRedeemEntries,proto3" json:"max_redeem_entries,omitempty" yaml:"max_redeem_entries"`
	// collateral_metas defines a set of collateral token metas that are supported by the module.
	CollateralMetas []TokenMeta `protobuf:"bytes,3,rep,name=collateral_metas,json=collateralMetas,proto3" json:"collateral_metas" yaml:"collateral_metas"`
	// usc_meta defines the USC token meta.
	// USC token must has a higher precision (number of decimals) than other collaterals.
	UscMeta TokenMeta `protobuf:"bytes,4,opt,name=usc_meta,json=uscMeta,proto3" json:"usc_meta" yaml:"usc_meta"`
	Enabled bool      `protobuf:"varint,5,opt,name=enabled,proto3" json:"enabled,omitempty" yaml:"enabled"`
}

func (m *Params) Reset()      { *m = Params{} }
func (*Params) ProtoMessage() {}
func (*Params) Descriptor() ([]byte, []int) {
	return fileDescriptor_6878f535799ff992, []int{0}
}
func (m *Params) XXX_Unmarshal(b []byte) error {
	return m.Unmarshal(b)
}
func (m *Params) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	if deterministic {
		return xxx_messageInfo_Params.Marshal(b, m, deterministic)
	} else {
		b = b[:cap(b)]
		n, err := m.MarshalToSizedBuffer(b)
		if err != nil {
			return nil, err
		}
		return b[:n], nil
	}
}
func (m *Params) XXX_Merge(src proto.Message) {
	xxx_messageInfo_Params.Merge(m, src)
}
func (m *Params) XXX_Size() int {
	return m.Size()
}
func (m *Params) XXX_DiscardUnknown() {
	xxx_messageInfo_Params.DiscardUnknown(m)
}

var xxx_messageInfo_Params proto.InternalMessageInfo

// TokenMeta defines USC / collateral token metadata.
type TokenMeta struct {
	// denom is the sdk.Coin denomination (ibc / native tokens).
	Denom string `protobuf:"bytes,1,opt,name=denom,proto3" json:"denom,omitempty" yaml:"denom"`
	// decimals is a number of decimals for the sdk.Coin amount value.
	// Example: coin amount of 1.0usdt with 3 decimals -> 1000.
	Decimals uint32 `protobuf:"varint,2,opt,name=decimals,proto3" json:"decimals,omitempty" yaml:"decimals"`
	// description is an optional token description (IBC source info for example).
	Description string `protobuf:"bytes,3,opt,name=description,proto3" json:"description,omitempty" yaml:"description"`
}

func (m *TokenMeta) Reset()      { *m = TokenMeta{} }
func (*TokenMeta) ProtoMessage() {}
func (*TokenMeta) Descriptor() ([]byte, []int) {
	return fileDescriptor_6878f535799ff992, []int{1}
}
func (m *TokenMeta) XXX_Unmarshal(b []byte) error {
	return m.Unmarshal(b)
}
func (m *TokenMeta) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	if deterministic {
		return xxx_messageInfo_TokenMeta.Marshal(b, m, deterministic)
	} else {
		b = b[:cap(b)]
		n, err := m.MarshalToSizedBuffer(b)
		if err != nil {
			return nil, err
		}
		return b[:n], nil
	}
}
func (m *TokenMeta) XXX_Merge(src proto.Message) {
	xxx_messageInfo_TokenMeta.Merge(m, src)
}
func (m *TokenMeta) XXX_Size() int {
	return m.Size()
}
func (m *TokenMeta) XXX_DiscardUnknown() {
	xxx_messageInfo_TokenMeta.DiscardUnknown(m)
}

var xxx_messageInfo_TokenMeta proto.InternalMessageInfo

// RedeemEntry defines a redeeming queue object entry.
type RedeemEntry struct {
	// address is a redeem target account.
	Address string `protobuf:"bytes,1,opt,name=address,proto3" json:"address,omitempty" yaml:"address"`
	// operations are redeem operations that are active.
	Operations []RedeemEntryOperation `protobuf:"bytes,2,rep,name=operations,proto3" json:"operations" yaml:"operations"`
}

func (m *RedeemEntry) Reset()      { *m = RedeemEntry{} }
func (*RedeemEntry) ProtoMessage() {}
func (*RedeemEntry) Descriptor() ([]byte, []int) {
	return fileDescriptor_6878f535799ff992, []int{2}
}
func (m *RedeemEntry) XXX_Unmarshal(b []byte) error {
	return m.Unmarshal(b)
}
func (m *RedeemEntry) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	if deterministic {
		return xxx_messageInfo_RedeemEntry.Marshal(b, m, deterministic)
	} else {
		b = b[:cap(b)]
		n, err := m.MarshalToSizedBuffer(b)
		if err != nil {
			return nil, err
		}
		return b[:n], nil
	}
}
func (m *RedeemEntry) XXX_Merge(src proto.Message) {
	xxx_messageInfo_RedeemEntry.Merge(m, src)
}
func (m *RedeemEntry) XXX_Size() int {
	return m.Size()
}
func (m *RedeemEntry) XXX_DiscardUnknown() {
	xxx_messageInfo_RedeemEntry.DiscardUnknown(m)
}

var xxx_messageInfo_RedeemEntry proto.InternalMessageInfo

// RedeemEntryOperation defines a single redeeming queue operation.
type RedeemEntryOperation struct {
	// creation_height is the height which the redeeming took place.
	CreationHeight int64 `protobuf:"varint,1,opt,name=creation_height,json=creationHeight,proto3" json:"creation_height,omitempty" yaml:"creation_height"`
	// completion_time is the unix time for redeeming completion.
	CompletionTime time.Time `protobuf:"bytes,2,opt,name=completion_time,json=completionTime,proto3,stdtime" json:"completion_time" yaml:"completion_time"`
	// collateral_amount are collateral tokens to redeem.
	CollateralAmount []types.Coin `protobuf:"bytes,3,rep,name=collateral_amount,json=collateralAmount,proto3" json:"collateral_amount" yaml:"collateral_amount"`
}

func (m *RedeemEntryOperation) Reset()      { *m = RedeemEntryOperation{} }
func (*RedeemEntryOperation) ProtoMessage() {}
func (*RedeemEntryOperation) Descriptor() ([]byte, []int) {
	return fileDescriptor_6878f535799ff992, []int{3}
}
func (m *RedeemEntryOperation) XXX_Unmarshal(b []byte) error {
	return m.Unmarshal(b)
}
func (m *RedeemEntryOperation) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	if deterministic {
		return xxx_messageInfo_RedeemEntryOperation.Marshal(b, m, deterministic)
	} else {
		b = b[:cap(b)]
		n, err := m.MarshalToSizedBuffer(b)
		if err != nil {
			return nil, err
		}
		return b[:n], nil
	}
}
func (m *RedeemEntryOperation) XXX_Merge(src proto.Message) {
	xxx_messageInfo_RedeemEntryOperation.Merge(m, src)
}
func (m *RedeemEntryOperation) XXX_Size() int {
	return m.Size()
}
func (m *RedeemEntryOperation) XXX_DiscardUnknown() {
	xxx_messageInfo_RedeemEntryOperation.DiscardUnknown(m)
}

var xxx_messageInfo_RedeemEntryOperation proto.InternalMessageInfo

// RedeemingQueueData defines the redeeming queue value object (completionTime timestamp is used as a key for the queue).
// Object is used to link queue data with a corresponding RedeemEntry object.
type RedeemingQueueData struct {
	Addresses []string `protobuf:"bytes,1,rep,name=addresses,proto3" json:"addresses,omitempty"`
}

func (m *RedeemingQueueData) Reset()      { *m = RedeemingQueueData{} }
func (*RedeemingQueueData) ProtoMessage() {}
func (*RedeemingQueueData) Descriptor() ([]byte, []int) {
	return fileDescriptor_6878f535799ff992, []int{4}
}
func (m *RedeemingQueueData) XXX_Unmarshal(b []byte) error {
	return m.Unmarshal(b)
}
func (m *RedeemingQueueData) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	if deterministic {
		return xxx_messageInfo_RedeemingQueueData.Marshal(b, m, deterministic)
	} else {
		b = b[:cap(b)]
		n, err := m.MarshalToSizedBuffer(b)
		if err != nil {
			return nil, err
		}
		return b[:n], nil
	}
}
func (m *RedeemingQueueData) XXX_Merge(src proto.Message) {
	xxx_messageInfo_RedeemingQueueData.Merge(m, src)
}
func (m *RedeemingQueueData) XXX_Size() int {
	return m.Size()
}
func (m *RedeemingQueueData) XXX_DiscardUnknown() {
	xxx_messageInfo_RedeemingQueueData.DiscardUnknown(m)
}

var xxx_messageInfo_RedeemingQueueData proto.InternalMessageInfo

func init() {
	proto.RegisterType((*Params)(nil), "secret.usc.v1beta1.Params")
	proto.RegisterType((*TokenMeta)(nil), "secret.usc.v1beta1.TokenMeta")
	proto.RegisterType((*RedeemEntry)(nil), "secret.usc.v1beta1.RedeemEntry")
	proto.RegisterType((*RedeemEntryOperation)(nil), "secret.usc.v1beta1.RedeemEntryOperation")
	proto.RegisterType((*RedeemingQueueData)(nil), "secret.usc.v1beta1.RedeemingQueueData")
}

func init() { proto.RegisterFile("secret/usc/v1beta1/usc.proto", fileDescriptor_6878f535799ff992) }

var fileDescriptor_6878f535799ff992 = []byte{
	// 732 bytes of a gzipped FileDescriptorProto
	0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xff, 0x84, 0x54, 0xbd, 0x6e, 0xdb, 0x48,
	0x10, 0x26, 0x2d, 0xff, 0x48, 0x2b, 0x9f, 0x65, 0xef, 0x19, 0xb6, 0x24, 0x9c, 0x49, 0x61, 0x8b,
	0x83, 0x8a, 0x03, 0x09, 0xfb, 0x9a, 0x83, 0xbb, 0xa3, 0x7d, 0x87, 0x00, 0xf9, 0x35, 0xe3, 0x2a,
	0x08, 0x20, 0xac, 0xc8, 0x0d, 0x45, 0x98, 0xcb, 0x15, 0xb8, 0xcb, 0xc4, 0x7e, 0x83, 0x94, 0x2e,
	0x5d, 0xba, 0x4c, 0xf2, 0x04, 0x79, 0x04, 0x97, 0x2e, 0x53, 0x29, 0x89, 0xdd, 0xa4, 0xd6, 0x13,
	0x04, 0xdc, 0x25, 0x45, 0x42, 0x32, 0x90, 0x6e, 0xf9, 0x7d, 0xdf, 0x7c, 0x33, 0x9c, 0xd9, 0x59,
	0xf0, 0x07, 0x27, 0x5e, 0x42, 0x84, 0x9d, 0x72, 0xcf, 0x7e, 0xbb, 0x3f, 0x24, 0x02, 0xef, 0x67,
	0x67, 0x6b, 0x9c, 0x30, 0xc1, 0x20, 0x54, 0xac, 0x95, 0x21, 0x39, 0xdb, 0xdd, 0x0e, 0x58, 0xc0,
	0x24, 0x6d, 0x67, 0x27, 0xa5, 0xec, 0x1a, 0x01, 0x63, 0x41, 0x44, 0x6c, 0xf9, 0x35, 0x4c, 0xdf,
	0xd8, 0x7e, 0x9a, 0x60, 0x11, 0xb2, 0x38, 0xe7, 0xcd, 0x79, 0x5e, 0x84, 0x94, 0x70, 0x81, 0xe9,
	0xb8, 0x30, 0xf0, 0x18, 0xa7, 0x8c, 0xdb, 0x43, 0xcc, 0xc9, 0xac, 0x12, 0x8f, 0x85, 0xb9, 0x01,
	0xfa, 0x58, 0x03, 0xab, 0x2f, 0x70, 0x82, 0x29, 0x87, 0xaf, 0x01, 0x48, 0x88, 0x4f, 0x08, 0x1d,
	0xf8, 0x69, 0xd2, 0xd6, 0x7b, 0x7a, 0xbf, 0x79, 0xd0, 0xb1, 0x54, 0x02, 0xab, 0x48, 0x60, 0x1d,
	0xe7, 0x05, 0x38, 0xe8, 0x66, 0x62, 0x6a, 0xd3, 0x89, 0xb9, 0x73, 0x81, 0x69, 0x74, 0x88, 0xca,
	0x50, 0x49, 0xa3, 0xab, 0xaf, 0xa6, 0xee, 0x36, 0x14, 0x7a, 0x9c, 0x26, 0xf0, 0x31, 0x80, 0x14,
	0x9f, 0x0f, 0x72, 0x19, 0x89, 0x45, 0x12, 0x12, 0xde, 0x5e, 0xea, 0xe9, 0xfd, 0xdf, 0x9c, 0xbd,
	0xe9, 0xc4, 0xec, 0x28, 0x9b, 0x45, 0x0d, 0x72, 0x37, 0x29, 0x3e, 0x77, 0x25, 0xf6, 0x9f, 0x82,
	0x60, 0x08, 0x36, 0x3d, 0x16, 0x45, 0x58, 0x90, 0x04, 0x47, 0x03, 0x4a, 0x04, 0xe6, 0xed, 0x5a,
	0xaf, 0xd6, 0x6f, 0x1e, 0xec, 0x59, 0x8b, 0xbd, 0xb5, 0x4e, 0xd9, 0x19, 0x89, 0x9f, 0x12, 0x81,
	0x1d, 0x33, 0x2f, 0x7a, 0x57, 0x65, 0x9b, 0x37, 0x41, 0x6e, 0xab, 0x84, 0xb2, 0x00, 0x0e, 0x4f,
	0x40, 0x3d, 0xe5, 0x9e, 0xa4, 0xdb, 0xcb, 0xb2, 0x27, 0xbf, 0x48, 0xb1, 0x9b, 0xa7, 0x68, 0xa9,
	0x14, 0x45, 0x30, 0x72, 0xd7, 0x52, 0xee, 0x65, 0x0a, 0xf8, 0x17, 0x58, 0x23, 0x31, 0x1e, 0x46,
	0xc4, 0x6f, 0xaf, 0xf4, 0xf4, 0x7e, 0xdd, 0x81, 0xd3, 0x89, 0xb9, 0xa1, 0xe4, 0x39, 0x81, 0xdc,
	0x42, 0x72, 0x58, 0xbf, 0xba, 0x36, 0xb5, 0x1f, 0xd7, 0xa6, 0x8e, 0x3e, 0xe8, 0xa0, 0x31, 0xcb,
	0x03, 0xff, 0x04, 0x2b, 0x3e, 0x89, 0x19, 0x95, 0x93, 0x6a, 0x38, 0x9b, 0xd3, 0x89, 0xb9, 0xae,
	0x3c, 0x24, 0x8c, 0x5c, 0x45, 0x43, 0x1b, 0xd4, 0x7d, 0xe2, 0x85, 0x14, 0x47, 0x45, 0xbb, 0x7f,
	0x2f, 0xab, 0x2b, 0x18, 0xe4, 0xce, 0x44, 0xf0, 0x1f, 0xd0, 0xf4, 0x09, 0xf7, 0x92, 0x70, 0x9c,
	0x0d, 0xb2, 0x5d, 0x93, 0xf6, 0x3b, 0xd3, 0x89, 0x09, 0x8b, 0x98, 0x19, 0x89, 0xdc, 0xaa, 0xb4,
	0x52, 0xea, 0x27, 0x1d, 0x34, 0xcb, 0x91, 0x5d, 0x64, 0xbf, 0x8c, 0x7d, 0x3f, 0x21, 0x9c, 0xe7,
	0xe5, 0x56, 0x7e, 0x39, 0x27, 0x90, 0x5b, 0x48, 0xa0, 0x07, 0x00, 0x1b, 0x13, 0x75, 0x91, 0xb2,
	0xa2, 0xb3, 0xc1, 0xf6, 0x1f, 0xea, 0x7a, 0x25, 0xc5, 0xf3, 0x22, 0xc0, 0xe9, 0xe4, 0x03, 0xd8,
	0x52, 0xf6, 0xa5, 0x13, 0x72, 0x2b, 0xb6, 0x95, 0x62, 0x3f, 0x2f, 0x81, 0xed, 0x87, 0x9c, 0xe0,
	0x11, 0x68, 0x79, 0x09, 0x91, 0xe7, 0xc1, 0x88, 0x84, 0xc1, 0x48, 0xc8, 0xea, 0x6b, 0x4e, 0xb7,
	0xbc, 0xf7, 0x73, 0x02, 0xe4, 0x6e, 0x14, 0xc8, 0x23, 0x09, 0xc0, 0x00, 0xb4, 0x3c, 0x46, 0xc7,
	0x11, 0x91, 0xaa, 0x6c, 0x3f, 0xe5, 0x18, 0x9a, 0x07, 0xdd, 0x85, 0xdd, 0x3a, 0x2d, 0x96, 0x77,
	0x7e, 0xb9, 0xe6, 0x0c, 0xd0, 0x65, 0xb6, 0x5c, 0x1b, 0x25, 0x9a, 0x05, 0xc2, 0x11, 0xd8, 0xaa,
	0xdc, 0x67, 0x4c, 0x59, 0x1a, 0x8b, 0x7c, 0x2b, 0x3a, 0x96, 0x7a, 0x06, 0xac, 0xec, 0x19, 0x98,
	0x75, 0xef, 0x88, 0x85, 0xb1, 0xd3, 0xcb, 0x33, 0xb5, 0x17, 0x36, 0x42, 0x39, 0x20, 0xb7, 0xb2,
	0x6a, 0xff, 0x4a, 0xa8, 0xd2, 0xba, 0xff, 0x01, 0x54, 0x9d, 0x0b, 0xe3, 0xe0, 0x24, 0x25, 0x29,
	0x39, 0xc6, 0x02, 0x43, 0x04, 0x1a, 0xf9, 0x28, 0x49, 0x36, 0xef, 0x5a, 0xbf, 0xe1, 0x2c, 0x67,
	0x69, 0xdc, 0x12, 0x3e, 0x5c, 0x7f, 0x7f, 0x6d, 0x6a, 0xb9, 0x8f, 0xe6, 0x3c, 0xb9, 0xf9, 0x6e,
	0x68, 0x37, 0x77, 0x86, 0x7e, 0x7b, 0x67, 0xe8, 0xdf, 0xee, 0x0c, 0xfd, 0xf2, 0xde, 0xd0, 0x6e,
	0xef, 0x0d, 0xed, 0xcb, 0xbd, 0xa1, 0xbd, 0xb2, 0x82, 0x50, 0x8c, 0xd2, 0xa1, 0xe5, 0x31, 0x6a,
	0x93, 0x38, 0x0c, 0x28, 0xa6, 0x63, 0xcf, 0x7e, 0x29, 0xef, 0xc3, 0x33, 0x22, 0xde, 0xb1, 0xe4,
	0xcc, 0x3e, 0x97, 0x6f, 0xad, 0xb8, 0x18, 0x13, 0x3e, 0x5c, 0x95, 0x1d, 0xfd, 0xfb, 0x67, 0x00,
	0x00, 0x00, 0xff, 0xff, 0x60, 0xf7, 0x39, 0x3b, 0x86, 0x05, 0x00, 0x00,
}

func (this *Params) Equal(that interface{}) bool {
	if that == nil {
		return this == nil
	}

	that1, ok := that.(*Params)
	if !ok {
		that2, ok := that.(Params)
		if ok {
			that1 = &that2
		} else {
			return false
		}
	}
	if that1 == nil {
		return this == nil
	} else if this == nil {
		return false
	}
	if this.RedeemDur != that1.RedeemDur {
		return false
	}
	if this.MaxRedeemEntries != that1.MaxRedeemEntries {
		return false
	}
	if len(this.CollateralMetas) != len(that1.CollateralMetas) {
		return false
	}
	for i := range this.CollateralMetas {
		if !this.CollateralMetas[i].Equal(&that1.CollateralMetas[i]) {
			return false
		}
	}
	if !this.UscMeta.Equal(&that1.UscMeta) {
		return false
	}
	if this.Enabled != that1.Enabled {
		return false
	}
	return true
}
func (this *TokenMeta) Equal(that interface{}) bool {
	if that == nil {
		return this == nil
	}

	that1, ok := that.(*TokenMeta)
	if !ok {
		that2, ok := that.(TokenMeta)
		if ok {
			that1 = &that2
		} else {
			return false
		}
	}
	if that1 == nil {
		return this == nil
	} else if this == nil {
		return false
	}
	if this.Denom != that1.Denom {
		return false
	}
	if this.Decimals != that1.Decimals {
		return false
	}
	if this.Description != that1.Description {
		return false
	}
	return true
}
func (this *RedeemEntry) Equal(that interface{}) bool {
	if that == nil {
		return this == nil
	}

	that1, ok := that.(*RedeemEntry)
	if !ok {
		that2, ok := that.(RedeemEntry)
		if ok {
			that1 = &that2
		} else {
			return false
		}
	}
	if that1 == nil {
		return this == nil
	} else if this == nil {
		return false
	}
	if this.Address != that1.Address {
		return false
	}
	if len(this.Operations) != len(that1.Operations) {
		return false
	}
	for i := range this.Operations {
		if !this.Operations[i].Equal(&that1.Operations[i]) {
			return false
		}
	}
	return true
}
func (this *RedeemEntryOperation) Equal(that interface{}) bool {
	if that == nil {
		return this == nil
	}

	that1, ok := that.(*RedeemEntryOperation)
	if !ok {
		that2, ok := that.(RedeemEntryOperation)
		if ok {
			that1 = &that2
		} else {
			return false
		}
	}
	if that1 == nil {
		return this == nil
	} else if this == nil {
		return false
	}
	if this.CreationHeight != that1.CreationHeight {
		return false
	}
	if !this.CompletionTime.Equal(that1.CompletionTime) {
		return false
	}
	if len(this.CollateralAmount) != len(that1.CollateralAmount) {
		return false
	}
	for i := range this.CollateralAmount {
		if !this.CollateralAmount[i].Equal(&that1.CollateralAmount[i]) {
			return false
		}
	}
	return true
}
func (m *Params) Marshal() (dAtA []byte, err error) {
	size := m.Size()
	dAtA = make([]byte, size)
	n, err := m.MarshalToSizedBuffer(dAtA[:size])
	if err != nil {
		return nil, err
	}
	return dAtA[:n], nil
}

func (m *Params) MarshalTo(dAtA []byte) (int, error) {
	size := m.Size()
	return m.MarshalToSizedBuffer(dAtA[:size])
}

func (m *Params) MarshalToSizedBuffer(dAtA []byte) (int, error) {
	i := len(dAtA)
	_ = i
	var l int
	_ = l
	if m.Enabled {
		i--
		if m.Enabled {
			dAtA[i] = 1
		} else {
			dAtA[i] = 0
		}
		i--
		dAtA[i] = 0x28
	}
	{
		size, err := m.UscMeta.MarshalToSizedBuffer(dAtA[:i])
		if err != nil {
			return 0, err
		}
		i -= size
		i = encodeVarintUsc(dAtA, i, uint64(size))
	}
	i--
	dAtA[i] = 0x22
	if len(m.CollateralMetas) > 0 {
		for iNdEx := len(m.CollateralMetas) - 1; iNdEx >= 0; iNdEx-- {
			{
				size, err := m.CollateralMetas[iNdEx].MarshalToSizedBuffer(dAtA[:i])
				if err != nil {
					return 0, err
				}
				i -= size
				i = encodeVarintUsc(dAtA, i, uint64(size))
			}
			i--
			dAtA[i] = 0x1a
		}
	}
	if m.MaxRedeemEntries != 0 {
		i = encodeVarintUsc(dAtA, i, uint64(m.MaxRedeemEntries))
		i--
		dAtA[i] = 0x10
	}
	n2, err2 := github_com_gogo_protobuf_types.StdDurationMarshalTo(m.RedeemDur, dAtA[i-github_com_gogo_protobuf_types.SizeOfStdDuration(m.RedeemDur):])
	if err2 != nil {
		return 0, err2
	}
	i -= n2
	i = encodeVarintUsc(dAtA, i, uint64(n2))
	i--
	dAtA[i] = 0xa
	return len(dAtA) - i, nil
}

func (m *TokenMeta) Marshal() (dAtA []byte, err error) {
	size := m.Size()
	dAtA = make([]byte, size)
	n, err := m.MarshalToSizedBuffer(dAtA[:size])
	if err != nil {
		return nil, err
	}
	return dAtA[:n], nil
}

func (m *TokenMeta) MarshalTo(dAtA []byte) (int, error) {
	size := m.Size()
	return m.MarshalToSizedBuffer(dAtA[:size])
}

func (m *TokenMeta) MarshalToSizedBuffer(dAtA []byte) (int, error) {
	i := len(dAtA)
	_ = i
	var l int
	_ = l
	if len(m.Description) > 0 {
		i -= len(m.Description)
		copy(dAtA[i:], m.Description)
		i = encodeVarintUsc(dAtA, i, uint64(len(m.Description)))
		i--
		dAtA[i] = 0x1a
	}
	if m.Decimals != 0 {
		i = encodeVarintUsc(dAtA, i, uint64(m.Decimals))
		i--
		dAtA[i] = 0x10
	}
	if len(m.Denom) > 0 {
		i -= len(m.Denom)
		copy(dAtA[i:], m.Denom)
		i = encodeVarintUsc(dAtA, i, uint64(len(m.Denom)))
		i--
		dAtA[i] = 0xa
	}
	return len(dAtA) - i, nil
}

func (m *RedeemEntry) Marshal() (dAtA []byte, err error) {
	size := m.Size()
	dAtA = make([]byte, size)
	n, err := m.MarshalToSizedBuffer(dAtA[:size])
	if err != nil {
		return nil, err
	}
	return dAtA[:n], nil
}

func (m *RedeemEntry) MarshalTo(dAtA []byte) (int, error) {
	size := m.Size()
	return m.MarshalToSizedBuffer(dAtA[:size])
}

func (m *RedeemEntry) MarshalToSizedBuffer(dAtA []byte) (int, error) {
	i := len(dAtA)
	_ = i
	var l int
	_ = l
	if len(m.Operations) > 0 {
		for iNdEx := len(m.Operations) - 1; iNdEx >= 0; iNdEx-- {
			{
				size, err := m.Operations[iNdEx].MarshalToSizedBuffer(dAtA[:i])
				if err != nil {
					return 0, err
				}
				i -= size
				i = encodeVarintUsc(dAtA, i, uint64(size))
			}
			i--
			dAtA[i] = 0x12
		}
	}
	if len(m.Address) > 0 {
		i -= len(m.Address)
		copy(dAtA[i:], m.Address)
		i = encodeVarintUsc(dAtA, i, uint64(len(m.Address)))
		i--
		dAtA[i] = 0xa
	}
	return len(dAtA) - i, nil
}

func (m *RedeemEntryOperation) Marshal() (dAtA []byte, err error) {
	size := m.Size()
	dAtA = make([]byte, size)
	n, err := m.MarshalToSizedBuffer(dAtA[:size])
	if err != nil {
		return nil, err
	}
	return dAtA[:n], nil
}

func (m *RedeemEntryOperation) MarshalTo(dAtA []byte) (int, error) {
	size := m.Size()
	return m.MarshalToSizedBuffer(dAtA[:size])
}

func (m *RedeemEntryOperation) MarshalToSizedBuffer(dAtA []byte) (int, error) {
	i := len(dAtA)
	_ = i
	var l int
	_ = l
	if len(m.CollateralAmount) > 0 {
		for iNdEx := len(m.CollateralAmount) - 1; iNdEx >= 0; iNdEx-- {
			{
				size, err := m.CollateralAmount[iNdEx].MarshalToSizedBuffer(dAtA[:i])
				if err != nil {
					return 0, err
				}
				i -= size
				i = encodeVarintUsc(dAtA, i, uint64(size))
			}
			i--
			dAtA[i] = 0x1a
		}
	}
	n3, err3 := github_com_gogo_protobuf_types.StdTimeMarshalTo(m.CompletionTime, dAtA[i-github_com_gogo_protobuf_types.SizeOfStdTime(m.CompletionTime):])
	if err3 != nil {
		return 0, err3
	}
	i -= n3
	i = encodeVarintUsc(dAtA, i, uint64(n3))
	i--
	dAtA[i] = 0x12
	if m.CreationHeight != 0 {
		i = encodeVarintUsc(dAtA, i, uint64(m.CreationHeight))
		i--
		dAtA[i] = 0x8
	}
	return len(dAtA) - i, nil
}

func (m *RedeemingQueueData) Marshal() (dAtA []byte, err error) {
	size := m.Size()
	dAtA = make([]byte, size)
	n, err := m.MarshalToSizedBuffer(dAtA[:size])
	if err != nil {
		return nil, err
	}
	return dAtA[:n], nil
}

func (m *RedeemingQueueData) MarshalTo(dAtA []byte) (int, error) {
	size := m.Size()
	return m.MarshalToSizedBuffer(dAtA[:size])
}

func (m *RedeemingQueueData) MarshalToSizedBuffer(dAtA []byte) (int, error) {
	i := len(dAtA)
	_ = i
	var l int
	_ = l
	if len(m.Addresses) > 0 {
		for iNdEx := len(m.Addresses) - 1; iNdEx >= 0; iNdEx-- {
			i -= len(m.Addresses[iNdEx])
			copy(dAtA[i:], m.Addresses[iNdEx])
			i = encodeVarintUsc(dAtA, i, uint64(len(m.Addresses[iNdEx])))
			i--
			dAtA[i] = 0xa
		}
	}
	return len(dAtA) - i, nil
}

func encodeVarintUsc(dAtA []byte, offset int, v uint64) int {
	offset -= sovUsc(v)
	base := offset
	for v >= 1<<7 {
		dAtA[offset] = uint8(v&0x7f | 0x80)
		v >>= 7
		offset++
	}
	dAtA[offset] = uint8(v)
	return base
}
func (m *Params) Size() (n int) {
	if m == nil {
		return 0
	}
	var l int
	_ = l
	l = github_com_gogo_protobuf_types.SizeOfStdDuration(m.RedeemDur)
	n += 1 + l + sovUsc(uint64(l))
	if m.MaxRedeemEntries != 0 {
		n += 1 + sovUsc(uint64(m.MaxRedeemEntries))
	}
	if len(m.CollateralMetas) > 0 {
		for _, e := range m.CollateralMetas {
			l = e.Size()
			n += 1 + l + sovUsc(uint64(l))
		}
	}
	l = m.UscMeta.Size()
	n += 1 + l + sovUsc(uint64(l))
	if m.Enabled {
		n += 2
	}
	return n
}

func (m *TokenMeta) Size() (n int) {
	if m == nil {
		return 0
	}
	var l int
	_ = l
	l = len(m.Denom)
	if l > 0 {
		n += 1 + l + sovUsc(uint64(l))
	}
	if m.Decimals != 0 {
		n += 1 + sovUsc(uint64(m.Decimals))
	}
	l = len(m.Description)
	if l > 0 {
		n += 1 + l + sovUsc(uint64(l))
	}
	return n
}

func (m *RedeemEntry) Size() (n int) {
	if m == nil {
		return 0
	}
	var l int
	_ = l
	l = len(m.Address)
	if l > 0 {
		n += 1 + l + sovUsc(uint64(l))
	}
	if len(m.Operations) > 0 {
		for _, e := range m.Operations {
			l = e.Size()
			n += 1 + l + sovUsc(uint64(l))
		}
	}
	return n
}

func (m *RedeemEntryOperation) Size() (n int) {
	if m == nil {
		return 0
	}
	var l int
	_ = l
	if m.CreationHeight != 0 {
		n += 1 + sovUsc(uint64(m.CreationHeight))
	}
	l = github_com_gogo_protobuf_types.SizeOfStdTime(m.CompletionTime)
	n += 1 + l + sovUsc(uint64(l))
	if len(m.CollateralAmount) > 0 {
		for _, e := range m.CollateralAmount {
			l = e.Size()
			n += 1 + l + sovUsc(uint64(l))
		}
	}
	return n
}

func (m *RedeemingQueueData) Size() (n int) {
	if m == nil {
		return 0
	}
	var l int
	_ = l
	if len(m.Addresses) > 0 {
		for _, s := range m.Addresses {
			l = len(s)
			n += 1 + l + sovUsc(uint64(l))
		}
	}
	return n
}

func sovUsc(x uint64) (n int) {
	return (math_bits.Len64(x|1) + 6) / 7
}
func sozUsc(x uint64) (n int) {
	return sovUsc(uint64((x << 1) ^ uint64((int64(x) >> 63))))
}
func (m *Params) Unmarshal(dAtA []byte) error {
	l := len(dAtA)
	iNdEx := 0
	for iNdEx < l {
		preIndex := iNdEx
		var wire uint64
		for shift := uint(0); ; shift += 7 {
			if shift >= 64 {
				return ErrIntOverflowUsc
			}
			if iNdEx >= l {
				return io.ErrUnexpectedEOF
			}
			b := dAtA[iNdEx]
			iNdEx++
			wire |= uint64(b&0x7F) << shift
			if b < 0x80 {
				break
			}
		}
		fieldNum := int32(wire >> 3)
		wireType := int(wire & 0x7)
		if wireType == 4 {
			return fmt.Errorf("proto: Params: wiretype end group for non-group")
		}
		if fieldNum <= 0 {
			return fmt.Errorf("proto: Params: illegal tag %d (wire type %d)", fieldNum, wire)
		}
		switch fieldNum {
		case 1:
			if wireType != 2 {
				return fmt.Errorf("proto: wrong wireType = %d for field RedeemDur", wireType)
			}
			var msglen int
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return ErrIntOverflowUsc
				}
				if iNdEx >= l {
					return io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				msglen |= int(b&0x7F) << shift
				if b < 0x80 {
					break
				}
			}
			if msglen < 0 {
				return ErrInvalidLengthUsc
			}
			postIndex := iNdEx + msglen
			if postIndex < 0 {
				return ErrInvalidLengthUsc
			}
			if postIndex > l {
				return io.ErrUnexpectedEOF
			}
			if err := github_com_gogo_protobuf_types.StdDurationUnmarshal(&m.RedeemDur, dAtA[iNdEx:postIndex]); err != nil {
				return err
			}
			iNdEx = postIndex
		case 2:
			if wireType != 0 {
				return fmt.Errorf("proto: wrong wireType = %d for field MaxRedeemEntries", wireType)
			}
			m.MaxRedeemEntries = 0
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return ErrIntOverflowUsc
				}
				if iNdEx >= l {
					return io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				m.MaxRedeemEntries |= uint32(b&0x7F) << shift
				if b < 0x80 {
					break
				}
			}
		case 3:
			if wireType != 2 {
				return fmt.Errorf("proto: wrong wireType = %d for field CollateralMetas", wireType)
			}
			var msglen int
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return ErrIntOverflowUsc
				}
				if iNdEx >= l {
					return io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				msglen |= int(b&0x7F) << shift
				if b < 0x80 {
					break
				}
			}
			if msglen < 0 {
				return ErrInvalidLengthUsc
			}
			postIndex := iNdEx + msglen
			if postIndex < 0 {
				return ErrInvalidLengthUsc
			}
			if postIndex > l {
				return io.ErrUnexpectedEOF
			}
			m.CollateralMetas = append(m.CollateralMetas, TokenMeta{})
			if err := m.CollateralMetas[len(m.CollateralMetas)-1].Unmarshal(dAtA[iNdEx:postIndex]); err != nil {
				return err
			}
			iNdEx = postIndex
		case 4:
			if wireType != 2 {
				return fmt.Errorf("proto: wrong wireType = %d for field UscMeta", wireType)
			}
			var msglen int
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return ErrIntOverflowUsc
				}
				if iNdEx >= l {
					return io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				msglen |= int(b&0x7F) << shift
				if b < 0x80 {
					break
				}
			}
			if msglen < 0 {
				return ErrInvalidLengthUsc
			}
			postIndex := iNdEx + msglen
			if postIndex < 0 {
				return ErrInvalidLengthUsc
			}
			if postIndex > l {
				return io.ErrUnexpectedEOF
			}
			if err := m.UscMeta.Unmarshal(dAtA[iNdEx:postIndex]); err != nil {
				return err
			}
			iNdEx = postIndex
		case 5:
			if wireType != 0 {
				return fmt.Errorf("proto: wrong wireType = %d for field Enabled", wireType)
			}
			var v int
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return ErrIntOverflowUsc
				}
				if iNdEx >= l {
					return io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				v |= int(b&0x7F) << shift
				if b < 0x80 {
					break
				}
			}
			m.Enabled = bool(v != 0)
		default:
			iNdEx = preIndex
			skippy, err := skipUsc(dAtA[iNdEx:])
			if err != nil {
				return err
			}
			if (skippy < 0) || (iNdEx+skippy) < 0 {
				return ErrInvalidLengthUsc
			}
			if (iNdEx + skippy) > l {
				return io.ErrUnexpectedEOF
			}
			iNdEx += skippy
		}
	}

	if iNdEx > l {
		return io.ErrUnexpectedEOF
	}
	return nil
}
func (m *TokenMeta) Unmarshal(dAtA []byte) error {
	l := len(dAtA)
	iNdEx := 0
	for iNdEx < l {
		preIndex := iNdEx
		var wire uint64
		for shift := uint(0); ; shift += 7 {
			if shift >= 64 {
				return ErrIntOverflowUsc
			}
			if iNdEx >= l {
				return io.ErrUnexpectedEOF
			}
			b := dAtA[iNdEx]
			iNdEx++
			wire |= uint64(b&0x7F) << shift
			if b < 0x80 {
				break
			}
		}
		fieldNum := int32(wire >> 3)
		wireType := int(wire & 0x7)
		if wireType == 4 {
			return fmt.Errorf("proto: TokenMeta: wiretype end group for non-group")
		}
		if fieldNum <= 0 {
			return fmt.Errorf("proto: TokenMeta: illegal tag %d (wire type %d)", fieldNum, wire)
		}
		switch fieldNum {
		case 1:
			if wireType != 2 {
				return fmt.Errorf("proto: wrong wireType = %d for field Denom", wireType)
			}
			var stringLen uint64
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return ErrIntOverflowUsc
				}
				if iNdEx >= l {
					return io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				stringLen |= uint64(b&0x7F) << shift
				if b < 0x80 {
					break
				}
			}
			intStringLen := int(stringLen)
			if intStringLen < 0 {
				return ErrInvalidLengthUsc
			}
			postIndex := iNdEx + intStringLen
			if postIndex < 0 {
				return ErrInvalidLengthUsc
			}
			if postIndex > l {
				return io.ErrUnexpectedEOF
			}
			m.Denom = string(dAtA[iNdEx:postIndex])
			iNdEx = postIndex
		case 2:
			if wireType != 0 {
				return fmt.Errorf("proto: wrong wireType = %d for field Decimals", wireType)
			}
			m.Decimals = 0
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return ErrIntOverflowUsc
				}
				if iNdEx >= l {
					return io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				m.Decimals |= uint32(b&0x7F) << shift
				if b < 0x80 {
					break
				}
			}
		case 3:
			if wireType != 2 {
				return fmt.Errorf("proto: wrong wireType = %d for field Description", wireType)
			}
			var stringLen uint64
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return ErrIntOverflowUsc
				}
				if iNdEx >= l {
					return io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				stringLen |= uint64(b&0x7F) << shift
				if b < 0x80 {
					break
				}
			}
			intStringLen := int(stringLen)
			if intStringLen < 0 {
				return ErrInvalidLengthUsc
			}
			postIndex := iNdEx + intStringLen
			if postIndex < 0 {
				return ErrInvalidLengthUsc
			}
			if postIndex > l {
				return io.ErrUnexpectedEOF
			}
			m.Description = string(dAtA[iNdEx:postIndex])
			iNdEx = postIndex
		default:
			iNdEx = preIndex
			skippy, err := skipUsc(dAtA[iNdEx:])
			if err != nil {
				return err
			}
			if (skippy < 0) || (iNdEx+skippy) < 0 {
				return ErrInvalidLengthUsc
			}
			if (iNdEx + skippy) > l {
				return io.ErrUnexpectedEOF
			}
			iNdEx += skippy
		}
	}

	if iNdEx > l {
		return io.ErrUnexpectedEOF
	}
	return nil
}
func (m *RedeemEntry) Unmarshal(dAtA []byte) error {
	l := len(dAtA)
	iNdEx := 0
	for iNdEx < l {
		preIndex := iNdEx
		var wire uint64
		for shift := uint(0); ; shift += 7 {
			if shift >= 64 {
				return ErrIntOverflowUsc
			}
			if iNdEx >= l {
				return io.ErrUnexpectedEOF
			}
			b := dAtA[iNdEx]
			iNdEx++
			wire |= uint64(b&0x7F) << shift
			if b < 0x80 {
				break
			}
		}
		fieldNum := int32(wire >> 3)
		wireType := int(wire & 0x7)
		if wireType == 4 {
			return fmt.Errorf("proto: RedeemEntry: wiretype end group for non-group")
		}
		if fieldNum <= 0 {
			return fmt.Errorf("proto: RedeemEntry: illegal tag %d (wire type %d)", fieldNum, wire)
		}
		switch fieldNum {
		case 1:
			if wireType != 2 {
				return fmt.Errorf("proto: wrong wireType = %d for field Address", wireType)
			}
			var stringLen uint64
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return ErrIntOverflowUsc
				}
				if iNdEx >= l {
					return io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				stringLen |= uint64(b&0x7F) << shift
				if b < 0x80 {
					break
				}
			}
			intStringLen := int(stringLen)
			if intStringLen < 0 {
				return ErrInvalidLengthUsc
			}
			postIndex := iNdEx + intStringLen
			if postIndex < 0 {
				return ErrInvalidLengthUsc
			}
			if postIndex > l {
				return io.ErrUnexpectedEOF
			}
			m.Address = string(dAtA[iNdEx:postIndex])
			iNdEx = postIndex
		case 2:
			if wireType != 2 {
				return fmt.Errorf("proto: wrong wireType = %d for field Operations", wireType)
			}
			var msglen int
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return ErrIntOverflowUsc
				}
				if iNdEx >= l {
					return io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				msglen |= int(b&0x7F) << shift
				if b < 0x80 {
					break
				}
			}
			if msglen < 0 {
				return ErrInvalidLengthUsc
			}
			postIndex := iNdEx + msglen
			if postIndex < 0 {
				return ErrInvalidLengthUsc
			}
			if postIndex > l {
				return io.ErrUnexpectedEOF
			}
			m.Operations = append(m.Operations, RedeemEntryOperation{})
			if err := m.Operations[len(m.Operations)-1].Unmarshal(dAtA[iNdEx:postIndex]); err != nil {
				return err
			}
			iNdEx = postIndex
		default:
			iNdEx = preIndex
			skippy, err := skipUsc(dAtA[iNdEx:])
			if err != nil {
				return err
			}
			if (skippy < 0) || (iNdEx+skippy) < 0 {
				return ErrInvalidLengthUsc
			}
			if (iNdEx + skippy) > l {
				return io.ErrUnexpectedEOF
			}
			iNdEx += skippy
		}
	}

	if iNdEx > l {
		return io.ErrUnexpectedEOF
	}
	return nil
}
func (m *RedeemEntryOperation) Unmarshal(dAtA []byte) error {
	l := len(dAtA)
	iNdEx := 0
	for iNdEx < l {
		preIndex := iNdEx
		var wire uint64
		for shift := uint(0); ; shift += 7 {
			if shift >= 64 {
				return ErrIntOverflowUsc
			}
			if iNdEx >= l {
				return io.ErrUnexpectedEOF
			}
			b := dAtA[iNdEx]
			iNdEx++
			wire |= uint64(b&0x7F) << shift
			if b < 0x80 {
				break
			}
		}
		fieldNum := int32(wire >> 3)
		wireType := int(wire & 0x7)
		if wireType == 4 {
			return fmt.Errorf("proto: RedeemEntryOperation: wiretype end group for non-group")
		}
		if fieldNum <= 0 {
			return fmt.Errorf("proto: RedeemEntryOperation: illegal tag %d (wire type %d)", fieldNum, wire)
		}
		switch fieldNum {
		case 1:
			if wireType != 0 {
				return fmt.Errorf("proto: wrong wireType = %d for field CreationHeight", wireType)
			}
			m.CreationHeight = 0
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return ErrIntOverflowUsc
				}
				if iNdEx >= l {
					return io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				m.CreationHeight |= int64(b&0x7F) << shift
				if b < 0x80 {
					break
				}
			}
		case 2:
			if wireType != 2 {
				return fmt.Errorf("proto: wrong wireType = %d for field CompletionTime", wireType)
			}
			var msglen int
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return ErrIntOverflowUsc
				}
				if iNdEx >= l {
					return io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				msglen |= int(b&0x7F) << shift
				if b < 0x80 {
					break
				}
			}
			if msglen < 0 {
				return ErrInvalidLengthUsc
			}
			postIndex := iNdEx + msglen
			if postIndex < 0 {
				return ErrInvalidLengthUsc
			}
			if postIndex > l {
				return io.ErrUnexpectedEOF
			}
			if err := github_com_gogo_protobuf_types.StdTimeUnmarshal(&m.CompletionTime, dAtA[iNdEx:postIndex]); err != nil {
				return err
			}
			iNdEx = postIndex
		case 3:
			if wireType != 2 {
				return fmt.Errorf("proto: wrong wireType = %d for field CollateralAmount", wireType)
			}
			var msglen int
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return ErrIntOverflowUsc
				}
				if iNdEx >= l {
					return io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				msglen |= int(b&0x7F) << shift
				if b < 0x80 {
					break
				}
			}
			if msglen < 0 {
				return ErrInvalidLengthUsc
			}
			postIndex := iNdEx + msglen
			if postIndex < 0 {
				return ErrInvalidLengthUsc
			}
			if postIndex > l {
				return io.ErrUnexpectedEOF
			}
			m.CollateralAmount = append(m.CollateralAmount, types.Coin{})
			if err := m.CollateralAmount[len(m.CollateralAmount)-1].Unmarshal(dAtA[iNdEx:postIndex]); err != nil {
				return err
			}
			iNdEx = postIndex
		default:
			iNdEx = preIndex
			skippy, err := skipUsc(dAtA[iNdEx:])
			if err != nil {
				return err
			}
			if (skippy < 0) || (iNdEx+skippy) < 0 {
				return ErrInvalidLengthUsc
			}
			if (iNdEx + skippy) > l {
				return io.ErrUnexpectedEOF
			}
			iNdEx += skippy
		}
	}

	if iNdEx > l {
		return io.ErrUnexpectedEOF
	}
	return nil
}
func (m *RedeemingQueueData) Unmarshal(dAtA []byte) error {
	l := len(dAtA)
	iNdEx := 0
	for iNdEx < l {
		preIndex := iNdEx
		var wire uint64
		for shift := uint(0); ; shift += 7 {
			if shift >= 64 {
				return ErrIntOverflowUsc
			}
			if iNdEx >= l {
				return io.ErrUnexpectedEOF
			}
			b := dAtA[iNdEx]
			iNdEx++
			wire |= uint64(b&0x7F) << shift
			if b < 0x80 {
				break
			}
		}
		fieldNum := int32(wire >> 3)
		wireType := int(wire & 0x7)
		if wireType == 4 {
			return fmt.Errorf("proto: RedeemingQueueData: wiretype end group for non-group")
		}
		if fieldNum <= 0 {
			return fmt.Errorf("proto: RedeemingQueueData: illegal tag %d (wire type %d)", fieldNum, wire)
		}
		switch fieldNum {
		case 1:
			if wireType != 2 {
				return fmt.Errorf("proto: wrong wireType = %d for field Addresses", wireType)
			}
			var stringLen uint64
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return ErrIntOverflowUsc
				}
				if iNdEx >= l {
					return io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				stringLen |= uint64(b&0x7F) << shift
				if b < 0x80 {
					break
				}
			}
			intStringLen := int(stringLen)
			if intStringLen < 0 {
				return ErrInvalidLengthUsc
			}
			postIndex := iNdEx + intStringLen
			if postIndex < 0 {
				return ErrInvalidLengthUsc
			}
			if postIndex > l {
				return io.ErrUnexpectedEOF
			}
			m.Addresses = append(m.Addresses, string(dAtA[iNdEx:postIndex]))
			iNdEx = postIndex
		default:
			iNdEx = preIndex
			skippy, err := skipUsc(dAtA[iNdEx:])
			if err != nil {
				return err
			}
			if (skippy < 0) || (iNdEx+skippy) < 0 {
				return ErrInvalidLengthUsc
			}
			if (iNdEx + skippy) > l {
				return io.ErrUnexpectedEOF
			}
			iNdEx += skippy
		}
	}

	if iNdEx > l {
		return io.ErrUnexpectedEOF
	}
	return nil
}
func skipUsc(dAtA []byte) (n int, err error) {
	l := len(dAtA)
	iNdEx := 0
	depth := 0
	for iNdEx < l {
		var wire uint64
		for shift := uint(0); ; shift += 7 {
			if shift >= 64 {
				return 0, ErrIntOverflowUsc
			}
			if iNdEx >= l {
				return 0, io.ErrUnexpectedEOF
			}
			b := dAtA[iNdEx]
			iNdEx++
			wire |= (uint64(b) & 0x7F) << shift
			if b < 0x80 {
				break
			}
		}
		wireType := int(wire & 0x7)
		switch wireType {
		case 0:
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return 0, ErrIntOverflowUsc
				}
				if iNdEx >= l {
					return 0, io.ErrUnexpectedEOF
				}
				iNdEx++
				if dAtA[iNdEx-1] < 0x80 {
					break
				}
			}
		case 1:
			iNdEx += 8
		case 2:
			var length int
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return 0, ErrIntOverflowUsc
				}
				if iNdEx >= l {
					return 0, io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				length |= (int(b) & 0x7F) << shift
				if b < 0x80 {
					break
				}
			}
			if length < 0 {
				return 0, ErrInvalidLengthUsc
			}
			iNdEx += length
		case 3:
			depth++
		case 4:
			if depth == 0 {
				return 0, ErrUnexpectedEndOfGroupUsc
			}
			depth--
		case 5:
			iNdEx += 4
		default:
			return 0, fmt.Errorf("proto: illegal wireType %d", wireType)
		}
		if iNdEx < 0 {
			return 0, ErrInvalidLengthUsc
		}
		if depth == 0 {
			return iNdEx, nil
		}
	}
	return 0, io.ErrUnexpectedEOF
}

var (
	ErrInvalidLengthUsc        = fmt.Errorf("proto: negative length found during unmarshaling")
	ErrIntOverflowUsc          = fmt.Errorf("proto: integer overflow")
	ErrUnexpectedEndOfGroupUsc = fmt.Errorf("proto: unexpected end of group")
)
