// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.36.6
// 	protoc        v3.6.1
// source: proto/rag-tools.proto

package rag_tools

import (
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	reflect "reflect"
	sync "sync"
	unsafe "unsafe"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type ChunkMarkdownRequest struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Content       string                 `protobuf:"bytes,1,opt,name=content,proto3" json:"content,omitempty"`
	ChunkSize     int32                  `protobuf:"varint,2,opt,name=chunk_size,json=chunkSize,proto3" json:"chunk_size,omitempty"`
	Overlap       int32                  `protobuf:"varint,3,opt,name=overlap,proto3" json:"overlap,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *ChunkMarkdownRequest) Reset() {
	*x = ChunkMarkdownRequest{}
	mi := &file_proto_rag_tools_proto_msgTypes[0]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *ChunkMarkdownRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ChunkMarkdownRequest) ProtoMessage() {}

func (x *ChunkMarkdownRequest) ProtoReflect() protoreflect.Message {
	mi := &file_proto_rag_tools_proto_msgTypes[0]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ChunkMarkdownRequest.ProtoReflect.Descriptor instead.
func (*ChunkMarkdownRequest) Descriptor() ([]byte, []int) {
	return file_proto_rag_tools_proto_rawDescGZIP(), []int{0}
}

func (x *ChunkMarkdownRequest) GetContent() string {
	if x != nil {
		return x.Content
	}
	return ""
}

func (x *ChunkMarkdownRequest) GetChunkSize() int32 {
	if x != nil {
		return x.ChunkSize
	}
	return 0
}

func (x *ChunkMarkdownRequest) GetOverlap() int32 {
	if x != nil {
		return x.Overlap
	}
	return 0
}

type ChunkMarkdownResponse struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Chunks        []string               `protobuf:"bytes,1,rep,name=chunks,proto3" json:"chunks,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *ChunkMarkdownResponse) Reset() {
	*x = ChunkMarkdownResponse{}
	mi := &file_proto_rag_tools_proto_msgTypes[1]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *ChunkMarkdownResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ChunkMarkdownResponse) ProtoMessage() {}

func (x *ChunkMarkdownResponse) ProtoReflect() protoreflect.Message {
	mi := &file_proto_rag_tools_proto_msgTypes[1]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ChunkMarkdownResponse.ProtoReflect.Descriptor instead.
func (*ChunkMarkdownResponse) Descriptor() ([]byte, []int) {
	return file_proto_rag_tools_proto_rawDescGZIP(), []int{1}
}

func (x *ChunkMarkdownResponse) GetChunks() []string {
	if x != nil {
		return x.Chunks
	}
	return nil
}

var File_proto_rag_tools_proto protoreflect.FileDescriptor

const file_proto_rag_tools_proto_rawDesc = "" +
	"\n" +
	"\x15proto/rag-tools.proto\x12\trag_tools\"i\n" +
	"\x14ChunkMarkdownRequest\x12\x18\n" +
	"\acontent\x18\x01 \x01(\tR\acontent\x12\x1d\n" +
	"\n" +
	"chunk_size\x18\x02 \x01(\x05R\tchunkSize\x12\x18\n" +
	"\aoverlap\x18\x03 \x01(\x05R\aoverlap\"/\n" +
	"\x15ChunkMarkdownResponse\x12\x16\n" +
	"\x06chunks\x18\x01 \x03(\tR\x06chunks2n\n" +
	"\x16MarkdownChunkerService\x12T\n" +
	"\rChunkMarkdown\x12\x1f.rag_tools.ChunkMarkdownRequest\x1a .rag_tools.ChunkMarkdownResponse\"\x00B\x11Z\x0fproto/rag-toolsb\x06proto3"

var (
	file_proto_rag_tools_proto_rawDescOnce sync.Once
	file_proto_rag_tools_proto_rawDescData []byte
)

func file_proto_rag_tools_proto_rawDescGZIP() []byte {
	file_proto_rag_tools_proto_rawDescOnce.Do(func() {
		file_proto_rag_tools_proto_rawDescData = protoimpl.X.CompressGZIP(unsafe.Slice(unsafe.StringData(file_proto_rag_tools_proto_rawDesc), len(file_proto_rag_tools_proto_rawDesc)))
	})
	return file_proto_rag_tools_proto_rawDescData
}

var file_proto_rag_tools_proto_msgTypes = make([]protoimpl.MessageInfo, 2)
var file_proto_rag_tools_proto_goTypes = []any{
	(*ChunkMarkdownRequest)(nil),  // 0: rag_tools.ChunkMarkdownRequest
	(*ChunkMarkdownResponse)(nil), // 1: rag_tools.ChunkMarkdownResponse
}
var file_proto_rag_tools_proto_depIdxs = []int32{
	0, // 0: rag_tools.MarkdownChunkerService.ChunkMarkdown:input_type -> rag_tools.ChunkMarkdownRequest
	1, // 1: rag_tools.MarkdownChunkerService.ChunkMarkdown:output_type -> rag_tools.ChunkMarkdownResponse
	1, // [1:2] is the sub-list for method output_type
	0, // [0:1] is the sub-list for method input_type
	0, // [0:0] is the sub-list for extension type_name
	0, // [0:0] is the sub-list for extension extendee
	0, // [0:0] is the sub-list for field type_name
}

func init() { file_proto_rag_tools_proto_init() }
func file_proto_rag_tools_proto_init() {
	if File_proto_rag_tools_proto != nil {
		return
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: unsafe.Slice(unsafe.StringData(file_proto_rag_tools_proto_rawDesc), len(file_proto_rag_tools_proto_rawDesc)),
			NumEnums:      0,
			NumMessages:   2,
			NumExtensions: 0,
			NumServices:   1,
		},
		GoTypes:           file_proto_rag_tools_proto_goTypes,
		DependencyIndexes: file_proto_rag_tools_proto_depIdxs,
		MessageInfos:      file_proto_rag_tools_proto_msgTypes,
	}.Build()
	File_proto_rag_tools_proto = out.File
	file_proto_rag_tools_proto_goTypes = nil
	file_proto_rag_tools_proto_depIdxs = nil
}
